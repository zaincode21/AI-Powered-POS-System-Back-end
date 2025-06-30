const pool = require('./config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connection successful! Server time:', res.rows[0].now);
  }
  pool.end();
}); 