const express = require('express');
const router = express.Router();
const saleItemController = require('../controllers/saleItemController');

// Get all sale items
router.get('/', saleItemController.getAllSaleItems);
// Get a sale item by ID
router.get('/:id', saleItemController.getSaleItemById);
// Create a new sale item
router.post('/', saleItemController.createSaleItem);
// Update a sale item
router.put('/:id', saleItemController.updateSaleItem);
// Delete a sale item
router.delete('/:id', saleItemController.deleteSaleItem);

module.exports = router; 