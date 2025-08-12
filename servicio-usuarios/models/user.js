const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, required: true, unique: true },
  password: String,
  rol: { 
    type: String, 
    enum: ['USUARIO', 'ORGANIZADOR', 'ADMIN'], 
    default: 'USUARIO',
    uppercase: true 
  },
  fechaRegistro: { type: Date, default: Date.now },
  ultimoAcceso: Date,
});

module.exports = mongoose.model('User', userSchema);
