const pool = require('../config/db');
const { upsertCustomer } = require('../models/customerModel');
const { insertSale } = require('../models/saleModel');
const { insertSaleItem } = require('../models/saleItemModel');

// Main sale transaction
exports.createSale = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer, sale, items } = req.body;
    // 1. Upsert customer
    const customer_id = await upsertCustomer(customer);
    // 2. Insert sale
    const saleResult = await insertSale(sale, customer_id);
    const sale_id = saleResult.id;
    // 3. Insert sale items
    let totalQuantity = 0;
    for (const item of items) {
      await insertSaleItem(sale_id, item);
      totalQuantity += item.quantity;
    }
    // 4. Update customer analytics
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
    
    // Best selling product (AI forecast placeholder)
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