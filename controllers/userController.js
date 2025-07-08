const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Create user
async function createUser(req, res) {
  try {
    let { password_hash, store_id, ...userData } = req.body;
    if (!store_id) {
      return res.status(400).json({ error: 'store_id is required.' });
    }
    // Validate store_id exists
    const store = await pool.query('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (store.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid store_id.' });
    }
    if (!password_hash) {
      // Set default password and hash it
      const defaultPassword = '123456';
      password_hash = await bcrypt.hash(defaultPassword, 10);
    }
    const user = await userModel.createUser({ ...userData, password_hash, store_id });
    res.status(201).json(user);
  } catch (err) {
    // Check for duplicate email error (PostgreSQL)
    if (err.code === '23505' && err.detail && err.detail.includes('email')) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get user by id
async function getUserById(req, res) {
  try {
    const user = await userModel.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    const user = await userModel.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete user (soft delete)
async function deleteUser(req, res) {
  try {
    const user = await userModel.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
}; 