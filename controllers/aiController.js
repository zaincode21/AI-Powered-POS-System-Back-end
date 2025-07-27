const {
  AIRecommendationService,
  AISalesForecastingService,
  AIFraudDetectionService,
  AIInventoryManagementService
} = require('../services/aiService');

// Product Recommendations
exports.getCustomerRecommendations = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 5 } = req.query;

    const recommendations = await AIRecommendationService.getCustomerRecommendations(
      customerId, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} recommendations for customer`
    });
  } catch (error) {
    console.error('Error getting customer recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer recommendations',
      details: error.message
    });
  }
};

exports.getPopularProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await AIRecommendationService.getPopularProducts(parseInt(limit));

    res.json({
      success: true,
      data: products,
      message: `Found ${products.length} popular products`
    });
  } catch (error) {
    console.error('Error getting popular products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular products',
      details: error.message
    });
  }
};

exports.getComplementaryProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    const products = await AIRecommendationService.getComplementaryProducts(
      productId, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: products,
      message: `Found ${products.length} complementary products`
    });
  } catch (error) {
    console.error('Error getting complementary products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complementary products',
      details: error.message
    });
  }
};

// Sales Forecasting
exports.getSalesForecast = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const forecast = await AISalesForecastingService.getSalesForecast(parseInt(days));

    res.json({
      success: true,
      data: forecast,
      message: `Generated ${days}-day sales forecast`
    });
  } catch (error) {
    console.error('Error getting sales forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales forecast',
      details: error.message
    });
  }
};

exports.getProductForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const forecast = await AISalesForecastingService.getProductForecast(
      productId, 
      parseInt(days)
    );

    res.json({
      success: true,
      data: forecast,
      message: `Generated ${days}-day forecast for product`
    });
  } catch (error) {
    console.error('Error getting product forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product forecast',
      details: error.message
    });
  }
};

// Fraud Detection
exports.detectFraud = async (req, res) => {
  try {
    const transaction = req.body;

    const fraudAnalysis = await AIFraudDetectionService.detectFraud(transaction);

    res.json({
      success: true,
      data: fraudAnalysis,
      message: fraudAnalysis.isFraudulent ? 'Fraud detected' : 'Transaction appears normal'
    });
  } catch (error) {
    console.error('Error in fraud detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform fraud detection',
      details: error.message
    });
  }
};

// Inventory Management
exports.getInventoryRecommendations = async (req, res) => {
  try {
    const recommendations = await AIInventoryManagementService.getInventoryRecommendations();

    // Group recommendations by type
    const groupedRecommendations = {
      lowStock: recommendations.filter(r => r.type === 'LOW_STOCK'),
      overstock: recommendations.filter(r => r.type === 'OVERSTOCK'),
      seasonal: recommendations.filter(r => r.type === 'SEASONAL_DEMAND')
    };

    res.json({
      success: true,
      data: {
        recommendations: groupedRecommendations,
        summary: {
          total: recommendations.length,
          lowStock: groupedRecommendations.lowStock.length,
          overstock: groupedRecommendations.overstock.length,
          seasonal: groupedRecommendations.seasonal.length
        }
      },
      message: `Generated ${recommendations.length} inventory recommendations`
    });
  } catch (error) {
    console.error('Error getting inventory recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory recommendations',
      details: error.message
    });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await AIInventoryManagementService.getLowStockItems();
    
    // Add AI recommendations for each item
    const alertsWithRecommendations = [];
    
    for (const item of lowStockItems) {
      const reorderQuantity = await AIInventoryManagementService.calculateReorderQuantity(item.id);
      const stockoutDate = await AIInventoryManagementService.estimateStockoutDate(item.id);
      
      alertsWithRecommendations.push({
        ...item,
        reorderQuantity,
        stockoutDate,
        urgency: AIInventoryManagementService.calculateUrgency(item.current_stock, item.min_stock_level)
      });
    }

    res.json({
      success: true,
      data: alertsWithRecommendations,
      message: `Found ${alertsWithRecommendations.length} low stock items`
    });
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get low stock alerts',
      details: error.message
    });
  }
};

// AI Dashboard Summary
exports.getAIDashboardSummary = async (req, res) => {
  try {
    // Get all AI insights in parallel
    const [
      popularProducts,
      salesForecast,
      inventoryRecommendations,
      lowStockAlerts
    ] = await Promise.all([
      AIRecommendationService.getPopularProducts(5),
      AISalesForecastingService.getSalesForecast(7),
      AIInventoryManagementService.getInventoryRecommendations(),
      AIInventoryManagementService.getLowStockItems()
    ]);

    // Calculate summary statistics
    const summary = {
      popularProducts: popularProducts.length,
      forecastDays: salesForecast.length,
      inventoryAlerts: inventoryRecommendations.length,
      criticalStockItems: lowStockAlerts.filter(item => 
        AIInventoryManagementService.calculateUrgency(item.current_stock, item.min_stock_level) === 'CRITICAL'
      ).length
    };

    res.json({
      success: true,
      data: {
        summary,
        popularProducts: popularProducts.slice(0, 3),
        salesForecast: salesForecast.slice(0, 7),
        criticalAlerts: inventoryRecommendations.filter(r => 
          r.type === 'LOW_STOCK' && r.urgency === 'CRITICAL'
        ).slice(0, 5)
      },
      message: 'AI dashboard summary generated successfully'
    });
  } catch (error) {
    console.error('Error getting AI dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI dashboard summary',
      details: error.message
    });
  }
}; 