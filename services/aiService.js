const pool = require('../config/db');

// AI Product Recommendations based on Customer Purchase History
class AIRecommendationService {
  // Get product recommendations for a customer based on their purchase history
  static async getCustomerRecommendations(customerId, limit = 5) {
    try {
      // Get customer's purchase history
      const purchaseHistory = await pool.query(`
        SELECT 
          si.product_id,
          p.name as product_name,
          p.category_id,
          c.name as category_name,
          COUNT(si.id) as purchase_count,
          SUM(si.quantity) as total_quantity,
          AVG(si.unit_price) as avg_price
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE s.customer_id = $1 AND s.is_active = true
        GROUP BY si.product_id, p.name, p.category_id, c.name
        ORDER BY purchase_count DESC, total_quantity DESC
      `, [customerId]);

      if (purchaseHistory.rows.length === 0) {
        // If no purchase history, return popular products
        return await this.getPopularProducts(limit);
      }

      // Get customer's preferred categories
      const preferredCategories = purchaseHistory.rows.map(row => row.category_id);

      // Find similar products in preferred categories
      const recommendations = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.selling_price,
          p.current_stock,
          c.name as category_name,
          p.product_number,
          p.barcode,
          ROW_NUMBER() OVER (ORDER BY p.selling_price DESC) as rank
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ANY($1)
        AND p.is_active = true
        AND p.current_stock > 0
        AND p.id NOT IN (
          SELECT DISTINCT si.product_id 
          FROM sale_items si 
          JOIN sales s ON si.sale_id = s.id 
          WHERE s.customer_id = $2
        )
        ORDER BY p.selling_price DESC
        LIMIT $3
      `, [preferredCategories, customerId, limit]);

      return recommendations.rows;
    } catch (error) {
      console.error('Error getting customer recommendations:', error);
      return [];
    }
  }

  // Get popular products across all customers
  static async getPopularProducts(limit = 10) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.selling_price,
          p.current_stock,
          c.name as category_name,
          p.product_number,
          p.barcode,
          COUNT(si.id) as sale_count,
          SUM(si.quantity) as total_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE p.is_active = true 
        AND p.current_stock > 0
        AND (s.is_active = true OR s.is_active IS NULL)
        GROUP BY p.id, p.name, p.selling_price, p.current_stock, c.name, p.product_number, p.barcode
        ORDER BY sale_count DESC, total_quantity DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  // Get complementary products (frequently bought together)
  static async getComplementaryProducts(productId, limit = 5) {
    try {
      const result = await pool.query(`
        WITH product_sales AS (
          SELECT DISTINCT s.id as sale_id
          FROM sales s
          JOIN sale_items si ON s.id = si.sale_id
          WHERE si.product_id = $1 AND s.is_active = true
        )
        SELECT 
          p.id,
          p.name,
          p.selling_price,
          p.current_stock,
          c.name as category_name,
          COUNT(ps.sale_id) as co_occurrence_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN sale_items si ON p.id = si.product_id
        JOIN product_sales ps ON si.sale_id = ps.sale_id
        WHERE p.id != $1 
        AND p.is_active = true 
        AND p.current_stock > 0
        GROUP BY p.id, p.name, p.selling_price, p.current_stock, c.name
        ORDER BY co_occurrence_count DESC
        LIMIT $2
      `, [productId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting complementary products:', error);
      return [];
    }
  }
}

// AI Sales Forecasting Service
class AISalesForecastingService {
  // Get sales forecast for next 30 days
  static async getSalesForecast(days = 30) {
    try {
      // Get historical sales data
      const historicalData = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transaction_count,
          SUM(total_amount) as daily_sales,
          AVG(total_amount) as avg_transaction_value
        FROM sales 
        WHERE created_at >= NOW() - INTERVAL '90 days'
        AND is_active = true
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      if (historicalData.rows.length === 0) {
        return this.generateDefaultForecast(days);
      }

      // Calculate trend and seasonality
      const forecast = this.calculateForecast(historicalData.rows, days);
      return forecast;
    } catch (error) {
      console.error('Error getting sales forecast:', error);
      return this.generateDefaultForecast(days);
    }
  }

  // Calculate forecast using simple moving average and trend analysis
  static calculateForecast(historicalData, days) {
    const forecast = [];
    const today = new Date();

    // Calculate 7-day moving average
    const recentData = historicalData.slice(-7);
    const avgDailySales = recentData.reduce((sum, day) => sum + parseFloat(day.daily_sales), 0) / recentData.length;
    const avgTransactions = recentData.reduce((sum, day) => sum + parseInt(day.transaction_count), 0) / recentData.length;

    // Simple trend calculation (linear regression)
    const trend = this.calculateTrend(historicalData);

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Apply trend and add some randomness
      const trendFactor = 1 + (trend * i / 100);
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness

      const predictedSales = avgDailySales * trendFactor * randomFactor;
      const predictedTransactions = avgTransactions * trendFactor * randomFactor;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedSales: Math.round(predictedSales),
        predictedTransactions: Math.round(predictedTransactions),
        confidence: 0.8 - (i * 0.02) // Confidence decreases over time
      });
    }

    return forecast;
  }

  // Calculate trend percentage
  static calculateTrend(data) {
    if (data.length < 2) return 0;

    const recent = data.slice(-7);
    const older = data.slice(-14, -7);

    const recentAvg = recent.reduce((sum, day) => sum + parseFloat(day.daily_sales), 0) / recent.length;
    const olderAvg = older.reduce((sum, day) => sum + parseFloat(day.daily_sales), 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  // Generate default forecast when no data available
  static generateDefaultForecast(days) {
    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedSales: 1000, // Default value
        predictedTransactions: 10, // Default value
        confidence: 0.5
      });
    }

    return forecast;
  }

  // Get product-specific sales forecast
  static async getProductForecast(productId, days = 30) {
    try {
      const historicalData = await pool.query(`
        SELECT 
          DATE(s.created_at) as date,
          SUM(si.quantity) as daily_quantity,
          COUNT(DISTINCT s.id) as daily_transactions
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = $1 
        AND s.created_at >= NOW() - INTERVAL '90 days'
        AND s.is_active = true
        GROUP BY DATE(s.created_at)
        ORDER BY date
      `, [productId]);

      if (historicalData.rows.length === 0) {
        return [];
      }

      // Calculate product forecast
      const recentData = historicalData.rows.slice(-7);
      const avgDailyQuantity = recentData.reduce((sum, day) => sum + parseInt(day.daily_quantity), 0) / recentData.length;

      const forecast = [];
      const today = new Date();

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);

        const randomFactor = 0.8 + Math.random() * 0.4; // ±20% randomness
        const predictedQuantity = Math.round(avgDailyQuantity * randomFactor);

        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedQuantity,
          confidence: 0.7 - (i * 0.02)
        });
      }

      return forecast;
    } catch (error) {
      console.error('Error getting product forecast:', error);
      return [];
    }
  }
}

// AI Fraud Detection Service
class AIFraudDetectionService {
  // Detect potential fraud in a transaction
  static async detectFraud(transaction) {
    const fraudIndicators = [];

    try {
      // 1. Check for unusual transaction amounts
      const avgTransaction = await this.getAverageTransactionAmount();
      if (transaction.total_amount > avgTransaction * 3) {
        fraudIndicators.push({
          type: 'HIGH_AMOUNT',
          severity: 'MEDIUM',
          message: `Transaction amount (${transaction.total_amount}) is significantly higher than average (${avgTransaction})`
        });
      }

      // 2. Check for rapid successive transactions
      const recentTransactions = await this.getRecentTransactionsByUser(transaction.user_id, 10);
      if (recentTransactions.length > 5) {
        fraudIndicators.push({
          type: 'RAPID_TRANSACTIONS',
          severity: 'HIGH',
          message: `User has made ${recentTransactions.length} transactions in the last 10 minutes`
        });
      }

      // 3. Check for unusual product combinations
      const unusualCombinations = await this.checkUnusualProductCombinations(transaction.items);
      if (unusualCombinations.length > 0) {
        fraudIndicators.push({
          type: 'UNUSUAL_COMBINATIONS',
          severity: 'LOW',
          message: `Unusual product combinations detected: ${unusualCombinations.join(', ')}`
        });
      }

      // 4. Check for time-based anomalies
      const timeAnomaly = this.checkTimeAnomaly(transaction.timestamp);
      if (timeAnomaly) {
        fraudIndicators.push({
          type: 'TIME_ANOMALY',
          severity: 'MEDIUM',
          message: 'Transaction occurred during unusual hours'
        });
      }

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(fraudIndicators);

      return {
        isFraudulent: riskScore > 0.7,
        riskScore,
        indicators: fraudIndicators,
        recommendation: this.getRecommendation(riskScore)
      };

    } catch (error) {
      console.error('Error in fraud detection:', error);
      return {
        isFraudulent: false,
        riskScore: 0,
        indicators: [],
        recommendation: 'Unable to perform fraud detection'
      };
    }
  }

  // Get average transaction amount
  static async getAverageTransactionAmount() {
    const result = await pool.query(`
      SELECT AVG(total_amount) as avg_amount
      FROM sales 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      AND is_active = true
    `);
    return result.rows[0]?.avg_amount || 1000;
  }

  // Get recent transactions by user
  static async getRecentTransactionsByUser(userId, minutes = 10) {
    const result = await pool.query(`
      SELECT id, total_amount, created_at
      FROM sales 
      WHERE user_id = $1 
      AND created_at >= NOW() - INTERVAL '${minutes} minutes'
      AND is_active = true
      ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
  }

  // Check for unusual product combinations
  static async checkUnusualProductCombinations(items) {
    const unusualCombinations = [];
    
    // Simple rule-based check - can be enhanced with ML
    const productIds = items.map(item => item.product_id);
    
    // Check for high-value items with low-value items (potential fraud pattern)
    const highValueItems = items.filter(item => item.price > 1000);
    const lowValueItems = items.filter(item => item.price < 100);
    
    if (highValueItems.length > 0 && lowValueItems.length > 0) {
      unusualCombinations.push('High-value with low-value items');
    }

    return unusualCombinations;
  }

  // Check for time-based anomalies
  static checkTimeAnomaly(timestamp) {
    const hour = new Date(timestamp).getHours();
    // Consider transactions between 2 AM and 6 AM as unusual
    return hour >= 2 && hour <= 6;
  }

  // Calculate risk score based on indicators
  static calculateRiskScore(indicators) {
    let score = 0;
    
    indicators.forEach(indicator => {
      switch (indicator.severity) {
        case 'HIGH':
          score += 0.4;
          break;
        case 'MEDIUM':
          score += 0.2;
          break;
        case 'LOW':
          score += 0.1;
          break;
      }
    });

    return Math.min(score, 1.0);
  }

  // Get recommendation based on risk score
  static getRecommendation(riskScore) {
    if (riskScore > 0.8) {
      return 'BLOCK_TRANSACTION';
    } else if (riskScore > 0.6) {
      return 'REQUIRE_MANAGER_APPROVAL';
    } else if (riskScore > 0.4) {
      return 'FLAG_FOR_REVIEW';
    } else {
      return 'PROCEED_NORMALLY';
    }
  }
}

// AI Inventory Management Service
class AIInventoryManagementService {
  // Get AI-powered inventory recommendations
  static async getInventoryRecommendations() {
    try {
      const recommendations = [];

      // 1. Low stock alerts with AI-suggested reorder quantities
      const lowStockItems = await this.getLowStockItems();
      for (const item of lowStockItems) {
        const reorderQuantity = await this.calculateReorderQuantity(item.id);
        recommendations.push({
          type: 'LOW_STOCK',
          product: item,
          currentStock: item.current_stock,
          recommendedReorderQuantity: reorderQuantity,
          urgency: this.calculateUrgency(item.current_stock, item.min_stock_level),
          estimatedStockoutDate: await this.estimateStockoutDate(item.id)
        });
      }

      // 2. Overstock alerts
      const overstockItems = await this.getOverstockItems();
      for (const item of overstockItems) {
        recommendations.push({
          type: 'OVERSTOCK',
          product: item,
          currentStock: item.current_stock,
          recommendedAction: 'Consider promotions or discounts',
          estimatedMonthsToSell: await this.estimateMonthsToSell(item.id)
        });
      }

      // 3. Seasonal recommendations
      const seasonalRecommendations = await this.getSeasonalRecommendations();
      recommendations.push(...seasonalRecommendations);

      return recommendations;
    } catch (error) {
      console.error('Error getting inventory recommendations:', error);
      return [];
    }
  }

  // Get low stock items
  static async getLowStockItems() {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= COALESCE(p.min_stock_level, 5)
      AND p.is_active = true
      ORDER BY p.current_stock ASC
    `);
    return result.rows;
  }

  // Get overstock items
  static async getOverstockItems() {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock > COALESCE(p.max_stock_level, 100)
      AND p.is_active = true
      ORDER BY p.current_stock DESC
    `);
    return result.rows;
  }

  // Calculate AI-suggested reorder quantity
  static async calculateReorderQuantity(productId) {
    try {
      // Get sales velocity (units sold per day)
      const salesVelocity = await this.getSalesVelocity(productId);
      
      // Get lead time (assume 7 days if not specified)
      const leadTime = 7;
      
      // Get safety stock (assume 20% of average daily sales)
      const safetyStock = Math.ceil(salesVelocity * 0.2);
      
      // Calculate reorder quantity: (daily sales × lead time) + safety stock
      const reorderQuantity = Math.ceil(salesVelocity * leadTime) + safetyStock;
      
      return Math.max(reorderQuantity, 1); // Minimum 1 unit
    } catch (error) {
      console.error('Error calculating reorder quantity:', error);
      return 10; // Default fallback
    }
  }

  // Get sales velocity (units sold per day)
  static async getSalesVelocity(productId) {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COUNT(DISTINCT DATE(s.created_at)) as days_with_sales
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE si.product_id = $1 
      AND s.created_at >= NOW() - INTERVAL '30 days'
      AND s.is_active = true
    `, [productId]);

    const totalQuantity = parseInt(result.rows[0]?.total_quantity || 0);
    const daysWithSales = parseInt(result.rows[0]?.days_with_sales || 1);
    
    return totalQuantity / daysWithSales;
  }

  // Calculate urgency level
  static calculateUrgency(currentStock, minStockLevel) {
    const ratio = currentStock / minStockLevel;
    
    if (ratio <= 0.5) return 'CRITICAL';
    if (ratio <= 1.0) return 'HIGH';
    if (ratio <= 1.5) return 'MEDIUM';
    return 'LOW';
  }

  // Estimate stockout date
  static async estimateStockoutDate(productId) {
    try {
      const salesVelocity = await this.getSalesVelocity(productId);
      const currentStock = await this.getCurrentStock(productId);
      
      if (salesVelocity <= 0) return null;
      
      const daysUntilStockout = Math.floor(currentStock / salesVelocity);
      const stockoutDate = new Date();
      stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
      
      return stockoutDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error estimating stockout date:', error);
      return null;
    }
  }

  // Get current stock
  static async getCurrentStock(productId) {
    const result = await pool.query(`
      SELECT current_stock FROM products WHERE id = $1
    `, [productId]);
    return parseInt(result.rows[0]?.current_stock || 0);
  }

  // Estimate months to sell overstock
  static async estimateMonthsToSell(productId) {
    try {
      const salesVelocity = await this.getSalesVelocity(productId);
      const currentStock = await this.getCurrentStock(productId);
      
      if (salesVelocity <= 0) return null;
      
      const daysToSell = currentStock / salesVelocity;
      return Math.ceil(daysToSell / 30); // Convert to months
    } catch (error) {
      console.error('Error estimating months to sell:', error);
      return null;
    }
  }

  // Get seasonal recommendations
  static async getSeasonalRecommendations() {
    const recommendations = [];
    const currentMonth = new Date().getMonth() + 1;

    // Simple seasonal logic - can be enhanced with ML
    const seasonalProducts = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      AND p.current_stock > 0
    `);

    for (const product of seasonalProducts.rows) {
      const seasonalFactor = this.getSeasonalFactor(product.category_name, currentMonth);
      
      if (seasonalFactor > 1.2) { // 20% above normal
        recommendations.push({
          type: 'SEASONAL_DEMAND',
          product: product,
          seasonalFactor: seasonalFactor,
          recommendation: 'Consider increasing stock for seasonal demand'
        });
      }
    }

    return recommendations;
  }

  // Get seasonal factor for a category
  static getSeasonalFactor(categoryName, month) {
    const seasonalFactors = {
      'Beverages': [1.1, 1.0, 1.2, 1.3, 1.4, 1.5, 1.6, 1.5, 1.3, 1.2, 1.1, 1.0],
      'Snacks': [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.4, 1.2, 1.1, 1.0, 1.0],
      'Electronics': [1.3, 1.2, 1.1, 1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.5]
    };

    const factors = seasonalFactors[categoryName] || Array(12).fill(1.0);
    return factors[month - 1] || 1.0;
  }
}

module.exports = {
  AIRecommendationService,
  AISalesForecastingService,
  AIFraudDetectionService,
  AIInventoryManagementService
}; 