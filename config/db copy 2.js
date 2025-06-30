const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT,
//   family: 4,
// });
const pool = new Pool({
  user: 'aipos',
  host: 'postgresql-aipos.alwaysdata.net',
  database: 'aipos_myshop',
  password: 'Serge!@#123',
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  family: 4,
});


module.exports = pool;