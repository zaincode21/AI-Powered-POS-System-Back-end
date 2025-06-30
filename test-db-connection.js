const pool = require('./config/db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Server time:', res.rows[0].now);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    pool.end();
  }
}

testConnection();