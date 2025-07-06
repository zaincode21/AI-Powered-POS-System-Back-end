const pool = require('../config/db');

// Create user
async function createUser({ username, email, password_hash, full_name, role, is_active, store_id }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role, is_active, store_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [username, email, password_hash, full_name, role, is_active, store_id]
  );
  return result.rows[0];
}

// Get all users
async function getAllUsers() {
  const result = await pool.query(`
    SELECT users.*, stores.name AS store_name
    FROM users
    LEFT JOIN stores ON users.store_id = stores.id
    ORDER BY users.created_at DESC
  `);
  return result.rows;
}

// Get user by id
async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Update user
async function updateUser(id, { username, email, password_hash, full_name, role, is_active, store_id }) {
  const result = await pool.query(
    `UPDATE users SET username=$1, email=$2, password_hash=$3, full_name=$4, role=$5, is_active=$6, store_id=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [username, email, password_hash, full_name, role, is_active, store_id, id]
  );
  return result.rows[0];
}

// Delete user
async function deleteUser(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// Get user by email and role
async function getUserByEmailAndRole(email, role) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
  return result.rows[0];
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserByEmailAndRole,
}; 