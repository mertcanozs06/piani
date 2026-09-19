const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'anipini_super_secret_pastel_key_2026');
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim, geçersiz veya süresi dolmuş token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yetkisiz erişim, token bulunamadı.' });
  }
};

module.exports = { protect };
