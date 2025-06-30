const pool = require('../config/db');

async function createSupplier(data) {
  const { name, contact_person, email, phone, address, payment_terms, is_active } = data;
  const result = await pool.query(
    `INSERT INTO suppliers (name, contact_person, email, phone, address, payment_terms, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, contact_person, email, phone, address, payment_terms, is_active]
  );
  return result.rows[0];
}

async function getSuppliers() {
  const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
  return result.rows;
}

async function getSupplierById(id) {
  const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateSupplier(id, data) {
  const { name, contact_person, email, phone, address, payment_terms, is_active } = data;
  const result = await pool.query(
    `UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5, payment_terms=$6, is_active=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [name, contact_person, email, phone, address, payment_terms, is_active, id]
  );
  return result.rows[0];
}

async function deleteSupplier(id) {
  const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
}; 