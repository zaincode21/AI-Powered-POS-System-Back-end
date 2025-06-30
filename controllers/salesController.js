const salesModel = require('../models/salesModel');

// Get all sales
async function getAllSales(req, res) {
  try {
    const sales = await salesModel.getAllSales();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

// Get a sale by ID
async function getSaleById(req, res) {
  try {
    const sale = await salesModel.getSaleById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
}

// Helper to generate sequential sale number
async function generateSequentialSaleNumber() {
  const result = await salesModel.getLatestSaleNumber();
  let nextNumber = 1;
  if (result && result.sale_number) {
    // Extract digits using regex
    const match = result.sale_number.match(/^SL-(\d{6})$/);
    if (match) {
      const lastNum = parseInt(match[1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
  }
  const padded = String(nextNumber).padStart(6, '0');
  return `SL-${padded}`;
}

// Create a new sale
async function createSale(req, res) {
  try {
    // Always set sale_number and sale_date
    const sale_number = await generateSequentialSaleNumber();
    const saleData = {
      ...req.body,
      sale_number,
      sale_date: new Date().toISOString(),
    };
    const newSale = await salesModel.createSale(saleData);
    res.status(201).json(newSale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sale' });
  }
}

// Update a sale
async function updateSale(req, res) {
  try {
    const updated = await salesModel.updateSale(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Sale not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sale' });
  }
}

// Delete a sale
async function deleteSale(req, res) {
  try {
    await salesModel.deleteSale(req.params.id);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sale' });
  }
}

// Fetch a sale with all its items by sale ID
async function getSaleWithItems(req, res) {
  try {
    const id = req.params.id;
    // Basic UUID validation
    if (!/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(id)) {
      return res.status(400).json({ error: 'Invalid sale ID format' });
    }
    const sale = await salesModel.getSaleWithItemsById(id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale with items' });
  }
}

// Create a sale and its items in one request
async function createSaleWithItems(req, res) {
  const { sale, items } = req.body;
  // Validate sale object
  const requiredFields = ['customer_id', 'user_id', 'store_id', 'total_amount', 'payment_method'];
  for (const field of requiredFields) {
    if (!sale[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }
  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one sale item is required' });
  }
  for (const item of items) {
    if (!item.product_id || !item.quantity || !item.unit_price) {
      return res.status(400).json({ error: 'Each item must have product_id, quantity, and unit_price' });
    }
  }
  // Always set sale_number and sale_date
  sale.sale_number = await generateSequentialSaleNumber();
  sale.sale_date = new Date().toISOString();
  try {
    const createdSale = await salesModel.createSaleWithItems(sale, items);
    res.status(201).json(createdSale);
  } catch (err) {
    // Unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Duplicate sale_number or unique constraint violation' });
    }
    // Foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid foreign key: referenced ID does not exist' });
    }
    res.status(500).json({ error: 'Failed to create sale with items', details: err.message });
  }
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getSaleWithItems,
  createSaleWithItems,
};

// Example usage of authentication middleware:
// const { authenticateToken } = require('../middleware/authMiddleware');
// router.get('/with-items/:id', authenticateToken, salesController.getSaleWithItems); 