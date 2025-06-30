const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // change to your db user
  host: 'localhost',
  database: 'myshop', // change to your db name
  password: 'Serge!@#123', // change to your db password
  port: 5432,
});

module.exports = pool; 