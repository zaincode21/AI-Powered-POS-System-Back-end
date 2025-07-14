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

  // Get the highest product_number
  const maxRes = await pool.query(
    `SELECT product_number FROM products WHERE product_number IS NOT NULL ORDER BY product_number DESC LIMIT 1`
  );
  let nextNum = 1;
  if (maxRes.rows.length > 0) {
    const lastCode = maxRes.rows[0].product_number;
    const match = lastCode && lastCode.match(/^PRD-(\d{3})$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
    else if (!isNaN(Number(lastCode))) nextNum = Number(lastCode) + 1;
  }
  const product_number = `PRD-${String(nextNum).padStart(3, '0')}`;

  const result = await pool.query(
    `INSERT INTO products (
      name, description, category_id, supplier_id,
      cost_price, selling_price,
      current_stock, min_stock_level, max_stock_level,
      reorder_point, reorder_quantity,
      barcode, sku, size, color, volume, weight,
      is_active, is_featured, product_number
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6,
      $7, $8, $9,
      $10, $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19, $20
    ) RETURNING *`,
    [
      name, description, category_id, supplier_id,
      cost_price, selling_price,
      current_stock, min_stock_level, max_stock_level,
      reorder_point, reorder_quantity,
      barcode, sku, size, color, volume, weight,
      is_active, is_featured, product_number
    ]
  );
  return result.rows[0];
}

async function getProducts(categoryId) {
  let query = `
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
  `;
  let params = [];
  if (categoryId && categoryId !== 'All') {
    query += ' WHERE p.category_id = $1';
    params.push(categoryId);
  }
  query += ' ORDER BY p.created_at DESC';
  const result = await pool.query(query, params);
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
    is_active, is_featured,
    user_id,
  } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query('SELECT selling_price FROM products WHERE id = $1', [id]);
    const currentProduct = currentRes.rows[0];
    let old_price = currentProduct ? currentProduct.selling_price : null;
    let priceChanged = old_price !== undefined && old_price !== null && Number(old_price) !== Number(selling_price);
    const result = await client.query(
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
    if (priceChanged) {
      await client.query(
        `INSERT INTO price_history (product_id, old_price, new_price, user_id, change_reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, old_price, selling_price, user_id || null, data.change_reason || 'Price update']
      );
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteProduct(id) {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

async function getPriceHistory(productId) {
  const result = await pool.query(
    `SELECT * FROM price_history WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId]
  );
  return result.rows;
}

async function getProductByNumber(product_number) {
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, s.name as supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.product_number = $1`, [product_number]
  );
  return result.rows[0];
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPriceHistory,
  getProductByNumber,
}; 