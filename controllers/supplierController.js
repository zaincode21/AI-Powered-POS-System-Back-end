const supplierModel = require('../models/supplierModel');

async function createSupplier(req, res) {
  try {
    const supplier = await supplierModel.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('email')) {
      return res.status(400).json({ error: 'Supplier email already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function getSuppliers(req, res) {
  try {
    const suppliers = await supplierModel.getSuppliers();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSupplierById(req, res) {
  try {
    const supplier = await supplierModel.getSupplierById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateSupplier(req, res) {
  try {
    const supplier = await supplierModel.updateSupplier(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    if (err.code === '23505' && err.detail && err.detail.includes('email')) {
      return res.status(400).json({ error: 'Supplier email already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

async function deleteSupplier(req, res) {
  try {
    const supplier = await supplierModel.deleteSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
}; 