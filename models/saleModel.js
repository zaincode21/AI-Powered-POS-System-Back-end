const pool = require('../config/db');
const { softDeleteSaleItemsBySaleId } = require('./saleItemModel');

async function insertSale(sale, customer_id) {
  // Generate next sale_number
  const codeRes = await pool.query(`SELECT sale_number FROM sales WHERE sale_number IS NOT NULL ORDER BY sale_number DESC LIMIT 1`);
  let nextNum = 1;
  if (codeRes.rows.length > 0) {
    const lastCode = codeRes.rows[0].sale_number;
    const match = lastCode && lastCode.match(/SL_(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const sale_number = `SL_${String(nextNum).padStart(3, '0')}`;
  const result = await pool.query(
    `INSERT INTO sales (sale_number, customer_id, user_id, store_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, notes, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, true)
     RETURNING id, sale_number`,
    [
      sale_number,
      customer_id,
      sale.user_id,
      sale.store_id || null,
      sale.subtotal,
      sale.tax_amount,
      sale.discount_amount,
      sale.total_amount,
      sale.payment_method,
      sale.payment_status,
      sale.notes || ''
    ]
  );
  return result.rows[0];
}

async function getSalesByCustomerId(customer_id) {
  const result = await pool.query(
    'SELECT * FROM sales WHERE customer_id = $1 ORDER BY created_at ASC',
    [customer_id]
  );
  return result.rows;
}

async function getAllSales() {
  const result = await pool.query(`
    SELECT s.*, c.full_name as customer_name,
      u.full_name as user_name, st.name as store_name,
      (
        SELECT json_agg(json_build_object('product_name', p.name, 'quantity', si.quantity))
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = s.id
      ) as items
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN stores st ON s.store_id = st.id
    WHERE s.is_active = true
    ORDER BY s.created_at DESC
  `);
  return result.rows;
}

async function deleteSale(saleId) {
  // Soft delete sale items first
  await softDeleteSaleItemsBySaleId(saleId);
  // Then soft delete the sale
  await pool.query('UPDATE sales SET is_active = false WHERE id = $1', [saleId]);
}

module.exports = {
  insertSale,
  getSalesByCustomerId,
  getAllSales,
  deleteSale,
}; 