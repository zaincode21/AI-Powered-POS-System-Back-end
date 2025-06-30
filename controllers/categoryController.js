const categoryModel = require('../models/categoryModel');

async function createCategory(req, res) {
  try {
    const category = await categoryModel.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('name')) {
      return res.status(400).json({ error: 'Category name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await categoryModel.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const category = await categoryModel.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCategory(req, res) {
  try {
    const category = await categoryModel.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('name')) {
      return res.status(400).json({ error: 'Category name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const category = await categoryModel.deleteCategory(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
}; 