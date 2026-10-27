
const jwt = require('jsonwebtoken');
require('dotenv').config();

// للتحقق من أن المستخدم مسجل دخول
exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'غير مصرح لك بالدخول' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'التوكن غير صالح' });
  }
};

// للتحقق من أن المستخدم مدير (Admin)
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'هذه الصلاحية للمدير فقط' });
  }
  next();
};
