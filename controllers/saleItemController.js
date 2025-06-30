const saleItemModel = require('../models/saleItemModel');

// Get all sale items
async function getAllSaleItems(req, res) {
  try {
    const items = await saleItemModel.getAllSaleItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale items' });
  }
}

// Get a sale item by ID
async function getSaleItemById(req, res) {
  try {
    const item = await saleItemModel.getSaleItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sale item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale item' });
  }
}

// Create a new sale item
async function createSaleItem(req, res) {
  try {
    const newItem = await saleItemModel.createSaleItem(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sale item' });
  }
}

// Update a sale item
async function updateSaleItem(req, res) {
  try {
    const updated = await saleItemModel.updateSaleItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Sale item not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sale item' });
  }
}

// Delete a sale item
async function deleteSaleItem(req, res) {
  try {
    await saleItemModel.deleteSaleItem(req.params.id);
    res.json({ message: 'Sale item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sale item' });
  }
}

module.exports = {
  getAllSaleItems,
  getSaleItemById,
  createSaleItem,
  updateSaleItem,
  deleteSaleItem,
}; 