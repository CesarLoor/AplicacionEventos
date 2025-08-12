const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { codigo: 'UNAUTHORIZED', mensaje: 'Token no proporcionado' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: { codigo: 'USER_NOT_FOUND', mensaje: 'Usuario no encontrado' } });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ error: { codigo: 'INVALID_TOKEN', mensaje: 'Token inválido o expirado' } });
  }
};

// Middleware para verificar roles específicos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { codigo: 'UNAUTHORIZED', mensaje: 'Usuario no autenticado' } });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: { 
          codigo: 'FORBIDDEN', 
          mensaje: `Requiere uno de los siguientes roles: ${roles.join(', ')}` 
        } 
      });
    }
    
    next();
  };
};

module.exports = { 
  protect, 
  authorize 
};
