const productModel = require('../models/productModel');

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
    const products = await productModel.getProducts();
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
    const product = await productModel.updateProduct(req.params.id, req.body);
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

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
}; 