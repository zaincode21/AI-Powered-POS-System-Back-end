const { Pool } = require('pg');

const pool = new Pool({
  user: 'aipos',
  host: 'postgresql-aipos.alwaysdata.net',
  database: 'aipos_myshop',
  password: 'Serge!@#123',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Required for self-signed certs or shared hosting
  },
  family: 4, // Force IPv4
});

module.exports = pool;
