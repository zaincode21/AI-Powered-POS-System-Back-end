const pool = require('../config/db');

exports.insertSaleItem = async (sale_id, item) => {
  await pool.query(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, product_name, product_sku, product_barcode)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      sale_id,
      item.product_id,
      item.quantity,
      item.unit_price,
      item.discount_amount || 0,
      item.product_name,
      item.product_sku || '',
      item.product_barcode || ''
    ]
  );
};

// Soft delete sale items by sale_id
exports.softDeleteSaleItemsBySaleId = async (sale_id) => {
  await pool.query('UPDATE sale_items SET is_active = false WHERE sale_id = $1', [sale_id]);
};

// Update get sale items to only return active ones
exports.getSaleItemsBySaleId = async (sale_id) => {
  const result = await pool.query('SELECT * FROM sale_items WHERE sale_id = $1 AND is_active = true', [sale_id]);
  return result.rows;
}; 