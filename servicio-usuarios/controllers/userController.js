const bcrypt = require('bcryptjs');
const User = require('../models/user');
const generateToken = require('../utils/generateToken');
const generalQueue = require('../queues/generalQueue');

// Registrar usuario
exports.registerUser = async (req, res) => {
  try {
    const { nombre, email, password, confirmarPassword, rol = 'usuario' } = req.body;

    // Validar que el rol sea válido
    const rolesPermitidos = ['USUARIO', 'ORGANIZADOR', 'ADMIN'];
    const rolNormalizado = rol ? rol.toUpperCase() : 'USUARIO';
    
    if (!rolesPermitidos.includes(rolNormalizado)) {
      return res.status(400).json({ 
        error: { 
          codigo: 'INVALID_ROLE', 
          mensaje: `Rol no válido. Los roles permitidos son: ${rolesPermitidos.join(', ')}` 
        } 
      });
    }

    if (password !== confirmarPassword) {
      return res.status(400).json({ error: { codigo: 'VALIDATION_ERROR', mensaje: 'Las contraseñas no coinciden' } });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: { codigo: 'EMAIL_ALREADY_EXISTS', mensaje: 'El correo ya está registrado' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Datos del usuario a crear
    const userData = { 
      nombre, 
      email, 
      password: hashedPassword, 
      rol: rolNormalizado
    };
    
    console.log('Creando usuario con rol:', userData.rol);
    
    console.log('Intentando crear usuario con datos:', JSON.stringify(userData, null, 2));
    
    const user = await User.create(userData);
    
    console.log('Usuario creado exitosamente:', JSON.stringify({
      _id: user._id,
      email: user.email,
      rol: user.rol,
      __v: user.__v
    }, null, 2));

    await generalQueue.add('userRegistered', { email: user.email, nombre: user.nombre });

    res.status(201).json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      fechaRegistro: user.fechaRegistro,
    });
  } catch (error) {
    console.error('❌ Error en registerUser:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al registrar usuario' } });
  }
};

// Login usuario
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: { codigo: 'UNAUTHORIZED', mensaje: 'Credenciales incorrectas' } });
    }

    user.ultimoAcceso = new Date();
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      token,
      usuario: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      expiraEn: 3600,
    });
  } catch (error) {
    console.error('❌ Error en loginUser:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno en login' } });
  }
};

// Obtener perfil del usuario logueado
exports.getProfile = (req, res) => {
  res.status(200).json(req.user);
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Usuario no encontrado' } });
    }

    user.nombre = req.body.nombre || user.nombre;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }
    await user.save();

    res.status(200).json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    console.error('❌ Error en updateProfile:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al actualizar usuario' } });
  }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error en getAllUsers:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener usuarios' } });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Usuario no encontrado' } });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('❌ Error en getUserById:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener usuario' } });
  }
};
