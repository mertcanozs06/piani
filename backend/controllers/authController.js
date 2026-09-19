const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// JWT Token Üretme
const generateToken = (user) => {
  return jwt.sign(
    { id: user.Id, email: user.Email, fullName: user.FullName },
    process.env.JWT_SECRET || 'anipini_super_secret_pastel_key_2026',
    { expiresIn: '7d' }
  );
};

// @desc   Kullanıcı Kaydı
// @route  POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, userType, address, latitude, longitude } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Lütfen tüm zorunlu alanları doldurun.' });
    }

    const accountType = userType === 'corporate' ? 'corporate' : 'individual';
    const pool = getPool();

    // E-posta kontrolü
    const checkUser = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @Email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Bu e-posta adresi ile kayıtlı bir hesap zaten var.' });
    }

    // Şifre Hashleme
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Varsayılan avatar ve biyografi
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(fullName)}`;
    const defaultBio = accountType === 'corporate' 
      ? 'Mekanımızın anılarını haritada paylaşıyoruz 🏢✨' 
      : 'Anılarımı haritada biriktiriyorum ✨';

    // Kaydetme
    const result = await pool.request()
      .input('FullName', sql.NVarChar, fullName)
      .input('Email', sql.NVarChar, email)
      .input('PasswordHash', sql.NVarChar, passwordHash)
      .input('Bio', sql.NVarChar, defaultBio)
      .input('AvatarUrl', sql.NVarChar, defaultAvatar)
      .input('UserType', sql.NVarChar, accountType)
      .input('Address', sql.NVarChar, address || null)
      .input('Latitude', sql.Float, latitude || null)
      .input('Longitude', sql.Float, longitude || null)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Bio, AvatarUrl, UserType, Address, Latitude, Longitude)
        OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.Bio, INSERTED.AvatarUrl, INSERTED.UserType, INSERTED.Address, INSERTED.Latitude, INSERTED.Longitude, INSERTED.CreatedAt
        VALUES (@FullName, @Email, @PasswordHash, @Bio, @AvatarUrl, @UserType, @Address, @Latitude, @Longitude)
      `);

    const user = result.recordset[0];

    if (accountType === 'corporate' && user.Latitude !== null && user.Longitude !== null) {
      await pool.request()
        .input('CategoryId', sql.Int, 2)
        .input('SpotName', sql.NVarChar, user.FullName)
        .input('SpotSubtitle', sql.NVarChar, user.Address || '')
        .input('Latitude', sql.Float, user.Latitude)
        .input('Longitude', sql.Float, user.Longitude)
        .query(`
          INSERT INTO Pins (CategoryId, SpotName, SpotSubtitle, Latitude, Longitude)
          SELECT @CategoryId, @SpotName, @SpotSubtitle, @Latitude, @Longitude
          WHERE NOT EXISTS (
            SELECT 1 FROM Pins
            WHERE ABS(Latitude - @Latitude) < 0.0015
              AND ABS(Longitude - @Longitude) < 0.0015
          )
        `);
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Kayıt başarıyla tamamlandı.',
      token,
      user: {
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        bio: user.Bio,
        avatarUrl: user.AvatarUrl,
        userType: user.UserType || 'individual',
        address: user.Address,
        latitude: user.Latitude,
        longitude: user.Longitude
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Kullanıcı Girişi
// @route  POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Lütfen e-posta ve şifrenizi girin.' });
    }

    const pool = getPool();

    const userResult = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @Email');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
    }

    const user = userResult.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Giriş başarılı.',
      token,
      user: {
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        bio: user.Bio,
        avatarUrl: user.AvatarUrl,
        userType: user.UserType || 'individual'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Mevcut Kullanıcı Bilgisi
// @route  GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('Id', sql.Int, req.user.id)
      .query('SELECT Id, FullName, Email, Bio, AvatarUrl, UserType, Address, Latitude, Longitude, CreatedAt FROM Users WHERE Id = @Id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.recordset[0];
    return res.json({
      success: true,
      user: {
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        bio: user.Bio,
        avatarUrl: user.AvatarUrl,
        userType: user.UserType || 'individual',
        address: user.Address,
        latitude: user.Latitude,
        longitude: user.Longitude,
        createdAt: user.CreatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
