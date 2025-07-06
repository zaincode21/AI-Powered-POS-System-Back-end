const productModel = require('../models/productModel');
const pool = require('../config/db');

async function createProduct(req, res) {
  try {
    const product = await productModel.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('barcode')) {
      return res.status(400).json({ error: 'Barcode already exists.' });
    }
    if (err.code === '23505' && err.detail && err.detail.includes('sku')) {
      return res.status(400).json({ error: 'SKU already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function getProducts(req, res) {
  try {
    const categoryId = req.query.category;
    const products = await productModel.getProducts(categoryId);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProductById(req, res) {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    // Attach user_id and change_reason for price history
    const user_id = req.body.user_id || (req.user && req.user.id) || null;
    const change_reason = req.body.change_reason || 'Price update';
    const product = await productModel.updateProduct(req.params.id, { ...req.body, user_id, change_reason });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('barcode')) {
      return res.status(400).json({ error: 'Barcode already exists.' });
    }
    if (err.code === '23505' && err.detail && err.detail.includes('sku')) {
      return res.status(400).json({ error: 'SKU already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await productModel.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPriceHistory(req, res) {
  try {
    const history = await productModel.getPriceHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getInventoryData(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
         p.name,
         c.name as category_name,
         p.current_stock as quantity,
         p.selling_price as price,
         CASE 
           WHEN p.current_stock = 0 THEN 'Out-Stock'
           WHEN p.current_stock <= COALESCE(p.min_stock_level, 5) THEN 'Low Stock'
           ELSE 'In Stock'
         END as status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true
       ORDER BY p.current_stock ASC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPriceHistory,
  getInventoryData,
}; 