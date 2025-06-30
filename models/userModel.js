const pool = require('../config/db');

// Create user
async function createUser({ username, email, password_hash, full_name, role, is_active }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [username, email, password_hash, full_name, role, is_active]
  );
  return result.rows[0];
}

// Get all users
async function getAllUsers() {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
}

// Get user by id
async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Update user
async function updateUser(id, { username, email, password_hash, full_name, role, is_active }) {
  const result = await pool.query(
    `UPDATE users SET username=$1, email=$2, password_hash=$3, full_name=$4, role=$5, is_active=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [username, email, password_hash, full_name, role, is_active, id]
  );
  return result.rows[0];
}

// Delete user
async function deleteUser(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

async function getUserByEmail(email) {
  return await User.findOne({ email });
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
}; 