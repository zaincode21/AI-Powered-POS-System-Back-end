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