const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const pinRoutes = require('./routes/pinRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AnıPini Backend Servisi Çalışıyor 🌸' });
});

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/users', userRoutes);

// Hata Yakalama Middleware'i
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Sunucuyu başlat ve Veritabanına Bağlan
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn('⚠️ Uyarı: Veritabanına henüz bağlanılamadı. Lütfen MSSQL Server 2022 çalışır durumda ve .env yapılandırması doğru olduğundan emin olun.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 AnıPini Sunucusu ${PORT} portunda başarıyla başlatıldı.`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
  });
};

startServer();
