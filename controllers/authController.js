const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register a new user (optional, for public registration)
async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ email, password_hash });
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Login user
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login }; 