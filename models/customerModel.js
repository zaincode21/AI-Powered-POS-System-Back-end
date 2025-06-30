const db = require('../config/db');

// Get all customers
async function getAllCustomers() {
  const { rows } = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
  return rows;
}

// Get customer by ID
async function getCustomerById(id) {
  const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
  return rows[0];
}

// Create customer
async function createCustomer(data) {
  const {
    customer_code, first_name, last_name, email, phone, date_of_birth, gender,
    address_line1, address_line2, city, state, postal_code, country,
    total_purchases, total_spent, average_order_value, preferred_category_id,
    customer_lifetime_value, loyalty_points, marketing_opt_in, preferred_contact_method,
    is_active, last_visit
  } = data;
  const { rows } = await db.query(
    `INSERT INTO customers (
      customer_code, first_name, last_name, email, phone, date_of_birth, gender,
      address_line1, address_line2, city, state, postal_code, country,
      total_purchases, total_spent, average_order_value, preferred_category_id,
      customer_lifetime_value, loyalty_points, marketing_opt_in, preferred_contact_method,
      is_active, last_visit
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,$13,
      $14,$15,$16,$17,
      $18,$19,$20,$21,
      $22,$23
    ) RETURNING *`,
    [
      customer_code, first_name, last_name, email, phone, date_of_birth, gender,
      address_line1, address_line2, city, state, postal_code, country,
      total_purchases, total_spent, average_order_value, preferred_category_id,
      customer_lifetime_value, loyalty_points, marketing_opt_in, preferred_contact_method,
      is_active, last_visit
    ]
  );
  return rows[0];
}

// Update customer (partial update for brevity)
async function updateCustomer(id, data) {
  const {
    first_name, last_name, email, phone, city, state, postal_code, country, is_active
  } = data;
  const { rows } = await db.query(
    `UPDATE customers SET
      first_name = $1, last_name = $2, email = $3, phone = $4,
      city = $5, state = $6, postal_code = $7, country = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 RETURNING *`,
    [first_name, last_name, email, phone, city, state, postal_code, country, is_active, id]
  );
  return rows[0];
}

// Delete customer
async function deleteCustomer(id) {
  await db.query('DELETE FROM customers WHERE id = $1', [id]);
}

// Get the latest customer_code
async function getLatestCustomerCode() {
  const { rows } = await db.query(
    `SELECT customer_code FROM customers ORDER BY customer_code DESC LIMIT 1`
  );
  return rows[0];
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getLatestCustomerCode,
}; 