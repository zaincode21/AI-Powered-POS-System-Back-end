const pool = require('../config/db');

// Upsert customer by email or phone
exports.upsertCustomer = async (customer) => {
  let { full_name, email, phone, tin } = customer;
  // Use unique default email if not provided
  if (!email) {
    email = `cust_${Date.now()}@gmail.com`;
  }
  let existing;
  if (email) {
    const res = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    existing = res.rows[0];
  }
  if (!existing && phone) {
    const res = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    existing = res.rows[0];
  }
  if (existing) {
    await pool.query(
      `UPDATE customers SET full_name = $1, tin = $2, updated_at = NOW() WHERE id = $3`,
      [full_name, tin || null, existing.id]
    );
    return existing.id;
  } else {
    // Generate next customer_code
    const codeRes = await pool.query(`SELECT customer_code FROM customers WHERE customer_code IS NOT NULL ORDER BY customer_code DESC LIMIT 1`);
    let nextNum = 1;
    if (codeRes.rows.length > 0) {
      const lastCode = codeRes.rows[0].customer_code;
      const match = lastCode && lastCode.match(/CUST-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const customer_code = `CUST-${String(nextNum).padStart(3, '0')}`;
    const result = await pool.query(
      `INSERT INTO customers (full_name, email, phone, tin, customer_code) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [full_name, email, phone, tin || null, customer_code]
    );
    return result.rows[0].id;
  }
};

// Get all customers
exports.getAllCustomers = async () => {
  const result = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY created_at DESC');
  return result.rows;
};

// Get customer by ID
exports.getCustomerById = async (id) => {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1 AND is_active = TRUE', [id]);
  return result.rows[0];
};

// Update customer by ID
exports.updateCustomer = async (id, customer) => {
  const { full_name, email, phone, tin } = customer;
  const result = await pool.query(
    `UPDATE customers SET full_name = $1, email = $2, phone = $3, tin = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
    [full_name, email, phone, tin || null, id]
  );
  return result.rows[0];
};

// Delete customer by ID
exports.deleteCustomer = async (id) => {
  await pool.query('UPDATE customers SET is_active = FALSE WHERE id = $1', [id]);
  return { success: true };
}; 