const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
  createProduct, getProducts, getProductById, updateProduct, deleteProduct, getPriceHistory, getProductByNumber 
} = require('../models/productModel');

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/inventory', productController.getInventoryData);
router.get('/number/:product_number', async (req, res) => {
  try {
    const product = await getProductByNumber(req.params.product_number);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/:id/price-history', productController.getPriceHistory);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router; 