const customerModel = require('../models/customerModel');

async function getAllCustomers(req, res) {
  try {
    const customers = await customerModel.getAllCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

async function getCustomerById(req, res) {
  try {
    const customer = await customerModel.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

async function generateSequentialCustomerCode() {
  const result = await customerModel.getLatestCustomerCode();
  let nextNumber = 1;
  if (result && result.customer_code) {
    const match = result.customer_code.match(/^COST-(\d{3})$/);
    if (match) {
      const lastNum = parseInt(match[1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
  }
  const padded = String(nextNumber).padStart(3, '0');
  return `COST-${padded}`;
}

async function createCustomer(req, res) {
  try {
    const customer_code = await generateSequentialCustomerCode();
    const newCustomer = await customerModel.createCustomer({
      ...req.body,
      customer_code,
    });
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
}

async function updateCustomer(req, res) {
  try {
    const updated = await customerModel.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

async function deleteCustomer(req, res) {
  try {
    await customerModel.deleteCustomer(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
}; 