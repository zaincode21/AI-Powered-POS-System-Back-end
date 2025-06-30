const pool = require('../config/db');

// Get all stores
async function getAllStores() {
  const result = await pool.query('SELECT * FROM stores ORDER BY created_at DESC');
  return result.rows;
}

// Get a store by ID
async function getStoreById(id) {
  const result = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
  return result.rows[0];
}

// Create a new store
async function createStore(data) {
  const {
    name, address, phone, email, tax_rate, currency, timezone
  } = data;
  const result = await pool.query(
    `INSERT INTO stores (name, address, phone, email, tax_rate, currency, timezone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, address, phone, email, tax_rate, currency, timezone]
  );
  return result.rows[0];
}

// Update a store
async function updateStore(id, data) {
  const {
    name, address, phone, email, tax_rate, currency, timezone
  } = data;
  const result = await pool.query(
    `UPDATE stores SET name=$1, address=$2, phone=$3, email=$4, tax_rate=$5, currency=$6, timezone=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [name, address, phone, email, tax_rate, currency, timezone, id]
  );
  return result.rows[0];
}

// Delete a store
async function deleteStore(id) {
  await pool.query('DELETE FROM stores WHERE id = $1', [id]);
}

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
}; 