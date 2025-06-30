const storeModel = require('../models/storeModel');

// Get all stores
async function getAllStores(req, res) {
  try {
    const stores = await storeModel.getAllStores();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
}

// Get a store by ID
async function getStoreById(req, res) {
  try {
    const store = await storeModel.getStoreById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
}

// Create a new store
async function createStore(req, res) {
  try {
    const newStore = await storeModel.createStore(req.body);
    res.status(201).json(newStore);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create store' });
  }
}

// Update a store
async function updateStore(req, res) {
  try {
    const updated = await storeModel.updateStore(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Store not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store' });
  }
}

// Delete a store
async function deleteStore(req, res) {
  try {
    await storeModel.deleteStore(req.params.id);
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete store' });
  }
}

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
}; 