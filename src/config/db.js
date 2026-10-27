const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({

  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initPool() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection pool created successfully');
  } catch (err) {
    console.error('❌ Failed to create PostgreSQL connection pool:', err);
    throw err;
  }
}

async function getConnection() {
  return pool;
}

module.exports = { initPool, getConnection };
