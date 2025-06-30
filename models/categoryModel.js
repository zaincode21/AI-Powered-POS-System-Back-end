const pool = require('../config/db');

async function createCategory(data) {
  const { name, description, parent_category_id, margin_percentage, is_active } = data;
  const result = await pool.query(
    `INSERT INTO categories (name, description, parent_category_id, margin_percentage, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, parent_category_id, margin_percentage, is_active]
  );
  return result.rows[0];
}

async function getCategories() {
  const result = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
  return result.rows;
}

async function getCategoryById(id) {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateCategory(id, data) {
  const { name, description, parent_category_id, margin_percentage, is_active } = data;
  const result = await pool.query(
    `UPDATE categories SET name=$1, description=$2, parent_category_id=$3, margin_percentage=$4, is_active=$5, updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [name, description, parent_category_id, margin_percentage, is_active, id]
  );
  return result.rows[0];
}

async function deleteCategory(id) {
  const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
}; 