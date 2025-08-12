const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: String,
  fechaHoraInicio: { type: Date, required: true },
  fechaHoraFin: { type: Date, required: true },
  localidadId: { type: String, required: true }, // id de la localidad
  precioEntrada: { type: Number, required: true },
  capacidadMaxima: { type: Number, required: true },
  categoria: String,
  estado: { type: String, enum: ['publicado', 'cancelado', 'completado'], default: 'publicado' },
  organizadorId: { type: String, required: true }, // id del usuario organizador
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
