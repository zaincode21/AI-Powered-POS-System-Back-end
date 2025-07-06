const customerModel = require('../models/customerModel');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await customerModel.getAllCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await customerModel.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const id = await customerModel.upsertCustomer(req.body);
    const customer = await customerModel.getCustomerById(id);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create customer', details: err.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await customerModel.updateCustomer(req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update customer', details: err.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    await customerModel.deleteCustomer(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete customer', details: err.message });
  }
}; 