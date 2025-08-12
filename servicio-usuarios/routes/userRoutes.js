const express = require('express');
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas públicas
router.post('/registro', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/perfil', protect, getProfile);
router.put('/perfil', protect, updateProfile);

// Rutas de administrador
router.get('/', protect, authorize('ADMIN'), getAllUsers);
router.get('/:id', protect, authorize('ADMIN'), getUserById);

module.exports = router;
