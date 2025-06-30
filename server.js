const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const storeRoutes = require('./routes/storeRoutes');
const saleItemRoutes = require('./routes/saleItemRoutes');
const authRoutes = require('./routes/authRoutes');
const authenticateToken = require('./middleware/authMiddleware');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/sale_items', saleItemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
  res.send('POS Backend API is running');
});

app.listen(port, () => {
  console.log(`Server running  on port ${port}`);
}); 