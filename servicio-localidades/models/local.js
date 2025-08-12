const mongoose = require('mongoose');

const localidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: String,
  ciudad: String,
  pais: String,
  capacidadMaxima: Number,
  coordenadas: {
    latitud: Number,
    longitud: Number,
  },
  imagenes: [String],
  descripcion: String,
});

module.exports = mongoose.model('Localidad', localidadSchema);
