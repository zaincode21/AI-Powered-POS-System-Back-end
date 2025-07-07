const pool = require('../config/db');

exports.insertSale = async (sale, customer_id) => {
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
    `INSERT INTO sales (sale_number, customer_id, user_id, store_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, sale_number`,
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
};

exports.getSalesByCustomerId = async (customer_id) => {
  const result = await pool.query(
    'SELECT * FROM sales WHERE customer_id = $1 ORDER BY created_at ASC',
    [customer_id]
  );
  return result.rows;
}; 