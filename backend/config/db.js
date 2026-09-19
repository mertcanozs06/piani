const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'AniPiniDB',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false, // For local SQL Server 2022 development
    trustServerCertificate: true, // Self-signed certs for local dev
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ MSSQL Veritabanına başarıyla bağlanıldı: AniPiniDB');
    }
    return pool;
  } catch (error) {
    console.error('❌ MSSQL Bağlantı hatası:', error.message);
    console.warn('⚠️ Lütfen .env dosyasındaki DB_USER, DB_PASSWORD ve DB_SERVER alanlarını kontrol edin.');
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Veritabanı bağlantısı henüz kurulmadı.');
  }
  return pool;
};

module.exports = {
  connectDB,
  getPool,
  sql
};
