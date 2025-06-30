const pool = require('../config/db');

// Get all sale items
async function getAllSaleItems() {
  const result = await pool.query('SELECT * FROM sale_items ORDER BY created_at DESC');
  return result.rows;
}

// Get a sale item by ID
async function getSaleItemById(id) {
  const result = await pool.query('SELECT * FROM sale_items WHERE id = $1', [id]);
  return result.rows[0];
}

// Create a new sale item
async function createSaleItem(data) {
  const {
    sale_id, product_id, quantity, unit_price, discount_amount, product_name, product_sku, product_barcode
  } = data;
  const result = await pool.query(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, product_name, product_sku, product_barcode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [sale_id, product_id, quantity, unit_price, discount_amount || 0, product_name, product_sku, product_barcode]
  );
  return result.rows[0];
}

// Update a sale item
async function updateSaleItem(id, data) {
  const {
    sale_id, product_id, quantity, unit_price, discount_amount, product_name, product_sku, product_barcode
  } = data;
  const result = await pool.query(
    `UPDATE sale_items SET sale_id=$1, product_id=$2, quantity=$3, unit_price=$4, discount_amount=$5, product_name=$6, product_sku=$7, product_barcode=$8
     WHERE id=$9 RETURNING *`,
    [sale_id, product_id, quantity, unit_price, discount_amount || 0, product_name, product_sku, product_barcode, id]
  );
  return result.rows[0];
}

// Delete a sale item
async function deleteSaleItem(id) {
  await pool.query('DELETE FROM sale_items WHERE id = $1', [id]);
}

module.exports = {
  getAllSaleItems,
  getSaleItemById,
  createSaleItem,
  updateSaleItem,
  deleteSaleItem,
}; 