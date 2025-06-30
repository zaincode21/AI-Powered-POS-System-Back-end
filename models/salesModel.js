const pool = require('../config/db');

// Get all sales (with items)
async function getAllSales() {
  const salesResult = await pool.query('SELECT * FROM sales ORDER BY created_at DESC');
  const sales = salesResult.rows;
  for (const sale of sales) {
    const itemsResult = await pool.query('SELECT * FROM sale_items WHERE sale_id = $1', [sale.id]);
    sale.items = itemsResult.rows;
  }
  return sales;
}

// Get a sale by ID
async function getSaleById(id) {
  const result = await pool.query('SELECT * FROM sales WHERE id = $1', [id]);
  return result.rows[0];
}

// Fetch a sale with all its items by sale ID
async function getSaleWithItemsById(id) {
  const saleResult = await pool.query('SELECT * FROM sales WHERE id = $1', [id]);
  if (saleResult.rows.length === 0) return null;
  const sale = saleResult.rows[0];
  const itemsResult = await pool.query('SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY created_at ASC', [id]);
  sale.items = itemsResult.rows;
  return sale;
}

// Create a new sale
async function createSale(data) {
  const {
    sale_number, customer_id, user_id, store_id,
    subtotal, tax_amount, discount_amount, total_amount,
    payment_method, payment_status, notes,
    loyalty_points_earned, loyalty_points_redeemed, sale_date
  } = data;
  const result = await pool.query(
    `INSERT INTO sales (
      sale_number, customer_id, user_id, store_id,
      subtotal, tax_amount, discount_amount, total_amount,
      payment_method, payment_status, notes,
      loyalty_points_earned, loyalty_points_redeemed, sale_date
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10, $11,
      $12, $13, $14
    ) RETURNING *`,
    [
      sale_number, customer_id, user_id, store_id,
      subtotal, tax_amount || 0, discount_amount || 0, total_amount,
      payment_method, payment_status || 'completed', notes,
      loyalty_points_earned || 0, loyalty_points_redeemed || 0, sale_date
    ]
  );
  return result.rows[0];
}

// Update a sale
async function updateSale(id, data) {
  const {
    sale_number, customer_id, user_id, store_id,
    subtotal, tax_amount, discount_amount, total_amount,
    payment_method, payment_status, notes,
    loyalty_points_earned, loyalty_points_redeemed, sale_date
  } = data;
  const result = await pool.query(
    `UPDATE sales SET
      sale_number=$1, customer_id=$2, user_id=$3, store_id=$4,
      subtotal=$5, tax_amount=$6, discount_amount=$7, total_amount=$8,
      payment_method=$9, payment_status=$10, notes=$11,
      loyalty_points_earned=$12, loyalty_points_redeemed=$13, sale_date=$14, updated_at=NOW()
     WHERE id=$15 RETURNING *`,
    [
      sale_number, customer_id, user_id, store_id,
      subtotal, tax_amount || 0, discount_amount || 0, total_amount,
      payment_method, payment_status || 'completed', notes,
      loyalty_points_earned || 0, loyalty_points_redeemed || 0, sale_date, id
    ]
  );
  return result.rows[0];
}

// Delete a sale
async function deleteSale(id) {
  await pool.query('DELETE FROM sales WHERE id = $1', [id]);
}

// Create a sale and its items in a transaction
async function createSaleWithItems(saleData, items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Insert into sales table
    const saleResult = await client.query(
      `INSERT INTO sales (sale_number, customer_id, user_id, store_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, notes, loyalty_points_earned, loyalty_points_redeemed, sale_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        saleData.sale_number, saleData.customer_id, saleData.user_id, saleData.store_id,
        saleData.subtotal, saleData.tax_amount || 0, saleData.discount_amount || 0, saleData.total_amount,
        saleData.payment_method, saleData.payment_status || 'completed', saleData.notes,
        saleData.loyalty_points_earned || 0, saleData.loyalty_points_redeemed || 0, saleData.sale_date
      ]
    );
    const sale = saleResult.rows[0];
    // Insert sale items and update product stock
    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, product_name, product_sku, product_barcode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)` ,
        [
          sale.id, item.product_id, item.quantity, item.unit_price, item.discount_amount || 0,
          item.product_name, item.product_sku, item.product_barcode
        ]
      );
      // Check current stock before updating
      const stockRes = await client.query(
        `SELECT current_stock, name FROM products WHERE id = $1`,
        [item.product_id]
      );
      const currentStock = stockRes.rows[0]?.current_stock ?? 0;
      const productName = stockRes.rows[0]?.name || item.product_id;
      if (currentStock - item.quantity < 0) {
        throw new Error(`Insufficient stock for product: ${productName}`);
      }
      // Update product stock
      await client.query(
        `UPDATE products SET current_stock = current_stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }
    // After inserting sale and sale items, update customer's total_spent
    await client.query(
      `UPDATE customers SET total_spent = total_spent + $1 WHERE id = $2`,
      [sale.total_amount, sale.customer_id]
    );
    await client.query('COMMIT');
    return sale;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get the latest sale_number
async function getLatestSaleNumber() {
  const result = await pool.query(
    `SELECT sale_number FROM sales ORDER BY sale_number DESC LIMIT 1`
  );
  return result.rows[0];
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getSaleWithItemsById,
  createSaleWithItems,
  getLatestSaleNumber,
}; 