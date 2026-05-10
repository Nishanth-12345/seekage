const mysql       = require('mysql2/promise');
const path        = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'seekage_db',
  waitForConnections: true,
  connectionLimit:    10,
});

module.exports = db;
