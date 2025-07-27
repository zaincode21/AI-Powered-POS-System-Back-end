const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Product Recommendations
router.get('/recommendations/customer/:customerId', aiController.getCustomerRecommendations);
router.get('/recommendations/popular', aiController.getPopularProducts);
router.get('/recommendations/complementary/:productId', aiController.getComplementaryProducts);

// Sales Forecasting
router.get('/forecast/sales', aiController.getSalesForecast);
router.get('/forecast/product/:productId', aiController.getProductForecast);

// Fraud Detection
router.post('/fraud/detect', aiController.detectFraud);

// Inventory Management
router.get('/inventory/recommendations', aiController.getInventoryRecommendations);
router.get('/inventory/low-stock-alerts', aiController.getLowStockAlerts);

// AI Dashboard Summary
router.get('/dashboard/summary', aiController.getAIDashboardSummary);

module.exports = router; 