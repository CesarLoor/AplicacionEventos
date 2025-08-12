const Event = require('../models/event');
const generalQueue = require('../queues/generalQueue');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error en getAllEvents:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener eventos' } });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Evento no encontrado' } });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Error en getEventById:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener evento' } });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fechaHoraInicio,
      fechaHoraFin,
      localidadId,
      precioEntrada,
      capacidadMaxima,
      categoria,
    } = req.body;

    const newEvent = await Event.create({
      titulo,
      descripcion,
      fechaHoraInicio,
      fechaHoraFin,
      localidadId,
      precioEntrada,
      capacidadMaxima,
      categoria,
      organizadorId: req.user.id,
    });

    await generalQueue.add('eventCreated', { titulo: newEvent.titulo, id: newEvent._id });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('❌ Error en createEvent:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al crear evento' } });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Evento no encontrado' } });
    }

    if (event.organizadorId !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({ error: { codigo: 'FORBIDDEN', mensaje: 'Solo el organizador o un admin pueden actualizar' } });
    }

    Object.assign(event, req.body, { fechaActualizacion: new Date() });
    await event.save();
    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Error en updateEvent:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al actualizar evento' } });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Evento no encontrado' } });
    }

    await event.deleteOne();
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error en deleteEvent:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al eliminar evento' } });
  }
};
