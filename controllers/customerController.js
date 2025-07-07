const customerModel = require('../models/customerModel');
const saleModel = require('../models/saleModel');

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

// Get AI insights for all customers
exports.getCustomerInsights = async (req, res) => {
  try {
    const customers = await customerModel.getAllCustomers();
    const insights = [];
    for (const customer of customers) {
      const sales = await saleModel.getSalesByCustomerId(customer.id);
      // Calculate total spent
      const totalSpent = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
      // Loyalty points (if available)
      const loyaltyPoints = customer.loyalty_points || 0;
      // Spending trend (amount per month)
      const trend = {};
      for (const sale of sales) {
        const date = new Date(sale.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
        trend[key] = (trend[key] || 0) + Number(sale.total_amount || 0);
      }
      // Simple segmentation
      let segment = 'Regular';
      if (totalSpent > 1000) segment = 'VIP';
      else if (totalSpent < 100) segment = 'At Risk';
      // Anomaly detection: sudden drop in spending
      const months = Object.keys(trend).sort();
      let anomaly = null;
      if (months.length > 1) {
        const last = trend[months[months.length-1]];
        const prev = trend[months[months.length-2]];
        if (prev > 0 && last < prev * 0.3) {
          anomaly = 'Spending dropped significantly this month.';
        }
      }
      // Recommendations: most purchased product(s)
      // (Assume you have sale_items table and can join for real recommendations)
      // For now, just a placeholder
      const recommendations = ['Try our new products!'];
      insights.push({
        customer_id: customer.id,
        full_name: customer.full_name,
        totalSpent,
        loyaltyPoints,
        segment,
        trend,
        anomaly,
        recommendations
      });
    }
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer insights', details: err.message });
  }
}; 