const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { codigo: 'UNAUTHORIZED', mensaje: 'Token no proporcionado' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contiene id, email y rol
    next();
  } catch {
    return res.status(401).json({ error: { codigo: 'INVALID_TOKEN', mensaje: 'Token inválido o expirado' } });
  }
};

const isOrganizer = (req, res, next) => {
  if (req.user.rol !== 'ORGANIZADOR' && req.user.rol !== 'ADMIN') {
    return res.status(403).json({ error: { codigo: 'FORBIDDEN', mensaje: 'Requiere rol de organizador' } });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ error: { codigo: 'FORBIDDEN', mensaje: 'Requiere rol de administrador' } });
  }
  next();
};

module.exports = { protect, isOrganizer, isAdmin };
