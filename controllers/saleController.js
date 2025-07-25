const pool = require('../config/db');
const { upsertCustomer } = require('../models/customerModel');
const { insertSale, getAllSales, deleteSale } = require('../models/saleModel');
const { insertSaleItem, getSaleItemsBySaleId } = require('../models/saleItemModel');

// Main sale transaction
exports.createSale = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer, sale, items } = req.body;
    
    // Validate that user_id exists in the database
    if (sale.user_id) {
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [sale.user_id]);
      if (userCheck.rows.length === 0) {
        throw new Error(`User with ID ${sale.user_id} does not exist. Please log in again.`);
      }
    }
    
    // 1. Validate stock availability before processing
    for (const item of items) {
      const stockResult = await client.query(
        'SELECT current_stock, name FROM products WHERE id = $1',
        [item.product_id]
      );
      
      if (stockResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }
      
      const product = stockResult.rows[0];
      if (product.current_stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}`);
      }
    }
    
    // 2. Upsert customer
    const customer_id = await upsertCustomer(customer);
    
    // 3. Insert sale
    const saleResult = await insertSale(sale, customer_id);
    const sale_id = saleResult.id;
    
    // 4. Insert sale items and update stock
    let totalQuantity = 0;
    for (const item of items) {
      await insertSaleItem(sale_id, item);
      
      // Update product stock
      await client.query(
        'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id]
      );
      
      totalQuantity += item.quantity;
    }
    
    // 5. Update customer analytics
    await client.query(
      `UPDATE customers SET total_purchases = COALESCE(total_purchases,0) + $1, total_spent = COALESCE(total_spent,0) + $2 WHERE id = $3`,
      [totalQuantity, sale.total_amount, customer_id]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ sale_id, sale_number: saleResult.sale_number });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale transaction error:', err);
    res.status(500).json({ error: 'Failed to process sale', details: err.message });
  } finally {
    client.release();
  }
};

// Get sales statistics for dashboard
exports.getSalesStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's sales
    const todaySalesResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as today_sales 
       FROM sales 
       WHERE DATE(created_at) = $1`,
      [today]
    );
    
    // Total customers
    const customersResult = await pool.query(
      `SELECT COUNT(*) as total_customers FROM customers`
    );
    
    // Inventory value
    const inventoryResult = await pool.query(
      `SELECT COALESCE(SUM(current_stock * selling_price), 0) as inventory_value 
       FROM products 
       WHERE is_active = true`
    );
    
    // Low stock items
    const lowStockResult = await pool.query(
      `SELECT COUNT(*) as low_stock_count 
       FROM products 
       WHERE (current_stock <= COALESCE(min_stock_level, 5) OR current_stock = 0) AND is_active = true`
    );
    
    // Best selling product
    const bestSellerResult = await pool.query(
      `SELECT p.name, COUNT(si.id) as sale_count
       FROM products p
       LEFT JOIN sale_items si ON p.id = si.product_id
       LEFT JOIN sales s ON si.sale_id = s.id
       WHERE p.is_active = true AND s.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY p.id, p.name
       ORDER BY sale_count DESC
       LIMIT 1`
    );
    
    const stats = {
      todaySales: parseFloat(todaySalesResult.rows[0].today_sales),
      totalCustomers: parseInt(customersResult.rows[0].total_customers),
      inventoryValue: parseFloat(inventoryResult.rows[0].inventory_value),
      lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count),
      bestSeller: bestSellerResult.rows[0]?.name || 'N/A'
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching sales stats:', err);
    res.status(500).json({ error: 'Failed to fetch sales statistics', details: err.message });
  }
};

// Get recent sales for dashboard
exports.getRecentSales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.sale_number, s.total_amount, s.created_at, c.full_name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ORDER BY s.created_at DESC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent sales:', err);
    res.status(500).json({ error: 'Failed to fetch recent sales', details: err.message });
  }
};

// Get daily sales data for charts
exports.getDailySales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         SUM(total_amount) as sales
       FROM sales 
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );
    
    // Fill in missing days with 0 sales
    const salesData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const existingData = result.rows.find(row => row.date === dateStr);
      salesData.push({
        name: dayName,
        sales: existingData ? parseFloat(existingData.sales) : 0
      });
    }
    
    res.json(salesData);
  } catch (err) {
    console.error('Error fetching daily sales:', err);
    res.status(500).json({ error: 'Failed to fetch daily sales', details: err.message });
  }
};

// Get sale items for a specific sale
exports.getSaleItems = async (req, res) => {
  const { saleId } = req.params;
  try {
    const result = await getSaleItemsBySaleId(saleId);
    res.json(result);
  } catch (err) {
    console.error('Error fetching sale items:', err);
    res.status(500).json({ error: 'Failed to fetch sale items', details: err.message });
  }
};

// Get sale details with items for stock management
exports.getSaleDetails = async (req, res) => {
  const { saleId } = req.params;
  try {
    const saleResult = await pool.query(
      `SELECT s.*, c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.is_active = true`,
      [saleId]
    );
    
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const sale = saleResult.rows[0];
    const items = await getSaleItemsBySaleId(saleId);
    
    res.json({ ...sale, items });
  } catch (err) {
    console.error('Error fetching sale details:', err);
    res.status(500).json({ error: 'Failed to fetch sale details', details: err.message });
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

exports.deleteSale = async (req, res) => {
  const { saleId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get sale items before deletion to restore stock
    const saleItems = await getSaleItemsBySaleId(saleId);
    
    // Restore stock quantities
    for (const item of saleItems) {
      await client.query(
        'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    // Delete the sale
    await deleteSale(saleId);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting sale:', err);
    res.status(500).json({ error: 'Failed to delete sale', details: err.message });
  } finally {
    client.release();
  }
}; 