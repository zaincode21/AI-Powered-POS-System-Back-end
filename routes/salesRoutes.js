const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.get('/:id', salesController.getSaleById);
router.post('/', salesController.createSaleWithItems);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);
router.get('/with-items/:id', salesController.getSaleWithItems);

module.exports = router; 