const pool = require('../config/db');

async function createProduct(data) {
  const {
    name, description, category_id, supplier_id,
    cost_price, selling_price,
    current_stock, min_stock_level, max_stock_level,
    reorder_point, reorder_quantity,
    barcode, sku, size, color, volume, weight,
    is_active, is_featured
  } = data;
  const result = await pool.query(
    `INSERT INTO products (
      name, description, category_id, supplier_id,
      cost_price, selling_price,
      current_stock, min_stock_level, max_stock_level,
      reorder_point, reorder_quantity,
      barcode, sku, size, color, volume, weight,
      is_active, is_featured
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6,
      $7, $8, $9,
      $10, $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19
    ) RETURNING *`,
    [
      name, description, category_id, supplier_id,
      cost_price, selling_price,
      current_stock, min_stock_level, max_stock_level,
      reorder_point, reorder_quantity,
      barcode, sku, size, color, volume, weight,
      is_active, is_featured
    ]
  );
  return result.rows[0];
}

async function getProducts() {
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

async function getProductById(id) {
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.id = $1`, [id]
  );
  return result.rows[0];
}

async function updateProduct(id, data) {
  const {
    name, description, category_id, supplier_id,
    cost_price, selling_price,
    current_stock, min_stock_level, max_stock_level,
    reorder_point, reorder_quantity,
    barcode, sku, size, color, volume, weight,
    is_active, is_featured
  } = data;
  const result = await pool.query(
    `UPDATE products SET
      name=$1, description=$2, category_id=$3, supplier_id=$4,
      cost_price=$5, selling_price=$6,
      current_stock=$7, min_stock_level=$8, max_stock_level=$9,
      reorder_point=$10, reorder_quantity=$11,
      barcode=$12, sku=$13, size=$14, color=$15, volume=$16, weight=$17,
      is_active=$18, is_featured=$19, updated_at=NOW()
     WHERE id=$20 RETURNING *`,
    [
      name, description, category_id, supplier_id,
      cost_price, selling_price,
      current_stock, min_stock_level, max_stock_level,
      reorder_point, reorder_quantity,
      barcode, sku, size, color, volume, weight,
      is_active, is_featured, id
    ]
  );
  return result.rows[0];
}

async function deleteProduct(id) {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
}; 