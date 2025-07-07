const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// POST /api/sales
router.post('/', saleController.createSale);

// GET /api/sales/stats - Get sales statistics for dashboard
router.get('/stats', saleController.getSalesStats);

// GET /api/sales/recent - Get recent sales for dashboard
router.get('/recent', saleController.getRecentSales);

// GET /api/sales/daily - Get daily sales data for charts
router.get('/daily', saleController.getDailySales);

// GET /api/sales/:saleId/items - Get sale items for a specific sale
router.get('/:saleId/items', saleController.getSaleItems);

module.exports = router; 