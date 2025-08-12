const jwt = require('jsonwebtoken');
const User = require('../models/local');

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { codigo: 'UNAUTHORIZED', mensaje: 'Token no proporcionado' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ error: { codigo: 'INVALID_TOKEN', mensaje: 'Token inválido o expirado' } });
  }
};

module.exports = { protect };
