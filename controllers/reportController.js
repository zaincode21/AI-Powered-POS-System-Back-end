const saleModel = require('../models/saleModel');
const productModel = require('../models/productModel');
const customerModel = require('../models/customerModel');
const supplierModel = require('../models/supplierModel');
const userModel = require('../models/userModel');
const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

exports.getReport = async (req, res) => {
  try {
    // Filters
    const { startDate, endDate } = req.query;
    let salesQuery = `
      SELECT s.*, c.full_name as customer_name,
        u.full_name as user_name, st.name as store_name,
        (
          SELECT json_agg(json_build_object('product_name', p.name, 'quantity', si.quantity))
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id
        ) as items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.is_active = true
    `;
    let params = [];
    if (startDate) {
      params.push(startDate);
      salesQuery += ` AND s.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      salesQuery += ` AND s.created_at <= $${params.length}`;
    }
    salesQuery += ' ORDER BY s.created_at DESC';
    const salesResult = await pool.query(salesQuery, params);
    const sales = salesResult.rows;

    // Sales summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax_amount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0);

    // Products (Inventory)
    const products = await productModel.getProducts();
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_level);

    // Customers
    const customers = await customerModel.getAllCustomers();
    const totalCustomers = customers.length;

    // Suppliers
    const suppliers = await supplierModel.getSuppliers();
    const totalSuppliers = suppliers.length;

    // Users
    const users = await userModel.getAllUsers();
    const totalUsers = users.length;

    res.json({
      sales: {
        totalSales,
        totalRevenue,
        totalTax,
        totalDiscount,
        details: sales
      },
      products: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        details: products
      },
      customers: {
        totalCustomers,
        details: customers
      },
      suppliers: {
        totalSuppliers,
        details: suppliers
      },
      users: {
        totalUsers,
        details: users
      }
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

exports.getReportPDF = async (req, res) => {
  try {
    // Reuse the aggregation logic from getReport
    const { startDate, endDate } = req.query;
    let salesQuery = `
      SELECT s.*, c.full_name as customer_name,
        u.full_name as user_name, st.name as store_name,
        (
          SELECT json_agg(json_build_object('product_name', p.name, 'quantity', si.quantity))
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id
        ) as items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.is_active = true
    `;
    let params = [];
    if (startDate) {
      params.push(startDate);
      salesQuery += ` AND s.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      salesQuery += ` AND s.created_at <= $${params.length}`;
    }
    salesQuery += ' ORDER BY s.created_at DESC';
    const salesResult = await pool.query(salesQuery, params);
    const sales = salesResult.rows;
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax_amount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0);
    const products = await productModel.getProducts();
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_level);
    const customers = await customerModel.getAllCustomers();
    const totalCustomers = customers.length;
    const suppliers = await supplierModel.getSuppliers();
    const totalSuppliers = suppliers.length;
    const users = await userModel.getAllUsers();
    const totalUsers = users.length;

    // PDF generation
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('Professional POS System Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || '...'} to ${endDate || '...'}`);
    }
    doc.moveDown();

    // Sales Summary
    doc.fontSize(16).text('Sales Summary', { underline: true });
    doc.fontSize(12).text(`Total Sales: ${totalSales}`);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    doc.text(`Total Tax: $${totalTax.toFixed(2)}`);
    doc.text(`Total Discount: $${totalDiscount.toFixed(2)}`);
    doc.moveDown();

    // Products Summary
    doc.fontSize(16).text('Inventory Summary', { underline: true });
    doc.fontSize(12).text(`Total Products: ${totalProducts}`);
    doc.text(`Low Stock Products: ${lowStockProducts.length}`);
    if (lowStockProducts.length > 0) {
      doc.text('Low Stock List:');
      lowStockProducts.slice(0, 10).forEach(p => {
        doc.text(`- ${p.name} (Stock: ${p.current_stock}, Min: ${p.min_stock_level})`);
      });
      if (lowStockProducts.length > 10) doc.text('...');
    }
    doc.moveDown();

    // Customers Summary
    doc.fontSize(16).text('Customers Summary', { underline: true });
    doc.fontSize(12).text(`Total Customers: ${totalCustomers}`);
    doc.moveDown();

    // Suppliers Summary
    doc.fontSize(16).text('Suppliers Summary', { underline: true });
    doc.fontSize(12).text(`Total Suppliers: ${totalSuppliers}`);
    doc.moveDown();

    // Users Summary
    doc.fontSize(16).text('Users Summary', { underline: true });
    doc.fontSize(12).text(`Total Users: ${totalUsers}`);
    doc.moveDown();

    // Optionally, add more detailed tables here (e.g., sales details, top products, etc.)
    doc.end();
  } catch (err) {
    console.error('Error generating PDF report:', err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

exports.getReportExcel = async (req, res) => {
  try {
    // Reuse the aggregation logic from getReport
    const { startDate, endDate } = req.query;
    let salesQuery = `
      SELECT s.*, c.full_name as customer_name,
        u.full_name as user_name, st.name as store_name,
        (
          SELECT json_agg(json_build_object('product_name', p.name, 'quantity', si.quantity))
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id
        ) as items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.is_active = true
    `;
    let params = [];
    if (startDate) {
      params.push(startDate);
      salesQuery += ` AND s.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      salesQuery += ` AND s.created_at <= $${params.length}`;
    }
    salesQuery += ' ORDER BY s.created_at DESC';
    const salesResult = await pool.query(salesQuery, params);
    const sales = salesResult.rows;
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax_amount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0);
    const products = await productModel.getProducts();
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_level);
    const customers = await customerModel.getAllCustomers();
    const totalCustomers = customers.length;
    const suppliers = await supplierModel.getSuppliers();
    const totalSuppliers = suppliers.length;
    const users = await userModel.getAllUsers();
    const totalUsers = users.length;

    // Excel generation
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS System';
    workbook.created = new Date();

    // Sales Sheet
    const salesSheet = workbook.addWorksheet('Sales Summary');
    salesSheet.addRow(['Total Sales', totalSales]);
    salesSheet.addRow(['Total Revenue', totalRevenue]);
    salesSheet.addRow(['Total Tax', totalTax]);
    salesSheet.addRow(['Total Discount', totalDiscount]);
    salesSheet.addRow([]);
    salesSheet.addRow(['Sale #', 'Customer', 'User', 'Store', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method', 'Status', 'Date']);
    sales.forEach(s => {
      salesSheet.addRow([
        s.sale_number,
        s.customer_name,
        s.user_name,
        s.store_name,
        s.subtotal,
        s.tax_amount,
        s.discount_amount,
        s.total_amount,
        s.payment_method,
        s.payment_status,
        s.created_at
      ]);
    });

    // Products Sheet
    const productsSheet = workbook.addWorksheet('Inventory');
    productsSheet.addRow(['Total Products', totalProducts]);
    productsSheet.addRow(['Low Stock Products', lowStockProducts.length]);
    productsSheet.addRow([]);
    productsSheet.addRow(['Name', 'Category', 'Supplier', 'Stock', 'Min Stock', 'Max Stock', 'Price', 'SKU', 'Barcode']);
    products.forEach(p => {
      productsSheet.addRow([
        p.name,
        p.category_name,
        p.supplier_name,
        p.current_stock,
        p.min_stock_level,
        p.max_stock_level,
        p.selling_price,
        p.sku,
        p.barcode
      ]);
    });

    // Customers Sheet
    const customersSheet = workbook.addWorksheet('Customers');
    customersSheet.addRow(['Total Customers', totalCustomers]);
    customersSheet.addRow([]);
    customersSheet.addRow(['Name', 'Email', 'Phone', 'TIN', 'Code', 'Created']);
    customers.forEach(c => {
      customersSheet.addRow([
        c.full_name,
        c.email,
        c.phone,
        c.tin,
        c.customer_code,
        c.created_at
      ]);
    });

    // Suppliers Sheet
    const suppliersSheet = workbook.addWorksheet('Suppliers');
    suppliersSheet.addRow(['Total Suppliers', totalSuppliers]);
    suppliersSheet.addRow([]);
    suppliersSheet.addRow(['Name', 'Contact', 'Email', 'Phone', 'Address', 'Payment Terms']);
    suppliers.forEach(sup => {
      suppliersSheet.addRow([
        sup.name,
        sup.contact_person,
        sup.email,
        sup.phone,
        sup.address,
        sup.payment_terms
      ]);
    });

    // Users Sheet
    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.addRow(['Total Users', totalUsers]);
    usersSheet.addRow([]);
    usersSheet.addRow(['Full Name', 'Username', 'Email', 'Role', 'Store', 'Created']);
    users.forEach(u => {
      usersSheet.addRow([
        u.full_name,
        u.username,
        u.email,
        u.role,
        u.store_name,
        u.created_at
      ]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating Excel report:', err);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
}; 