const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// GET /api/customers
router.get('/', customerController.getCustomers);
// GET /api/customers/:id
router.get('/:id', customerController.getCustomerById);
// POST /api/customers
router.post('/', customerController.createCustomer);
// PUT /api/customers/:id
router.put('/:id', customerController.updateCustomer);
// DELETE /api/customers/:id
router.delete('/:id', customerController.deleteCustomer);
// GET /api/customers/insights
router.get('/insights', customerController.getCustomerInsights);

module.exports = router; 