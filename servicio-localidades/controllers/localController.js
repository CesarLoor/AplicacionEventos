const Localidad = require('../models/local');
const generalQueue = require('../queues/generalQueue');

exports.getAllLocalidades = async (req, res) => {
  try {
    const localidades = await Localidad.find();
    res.status(200).json(localidades);
  } catch (error) {
    console.error('❌ Error en getAllLocalidades:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener localidades' } });
  }
};

exports.getLocalidadById = async (req, res) => {
  try {
    const localidad = await Localidad.findById(req.params.id);
    if (!localidad) {
      return res.status(404).json({ error: { codigo: 'RESOURCE_NOT_FOUND', mensaje: 'Localidad no encontrada' } });
    }
    res.status(200).json(localidad);
  } catch (error) {
    console.error('❌ Error en getLocalidadById:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al obtener localidad' } });
  }
};

exports.getEventosByLocalidad = async (req, res) => {
  res.status(200).json({
    mensaje: `Aquí se devolverían los eventos para la localidad con ID ${req.params.id}`,
  });
};

exports.createLocalidad = async (req, res) => {
  try {
    const { nombre, direccion, ciudad, pais, capacidadMaxima } = req.body;

    const localidad = await Localidad.create({
      nombre,
      direccion,
      ciudad,
      pais,
      capacidadMaxima,
      descripcion: req.body.descripcion,
      coordenadas: req.body.coordenadas,
      imagenes: req.body.imagenes,
    });

    await generalQueue.add('localidadCreated', { nombre: localidad.nombre });

    // ✅ Devuelve un objeto plano con id
    res.status(201).json({
      id: localidad._id,
      nombre: localidad.nombre,
      direccion: localidad.direccion,
      ciudad: localidad.ciudad,
      pais: localidad.pais,
      capacidadMaxima: localidad.capacidadMaxima,
      descripcion: localidad.descripcion,
      coordenadas: localidad.coordenadas,
      imagenes: localidad.imagenes
    });
  } catch (error) {
    console.error('❌ Error en createLocalidad:', error);
    res.status(500).json({ error: { codigo: 'INTERNAL_ERROR', mensaje: 'Error interno al crear localidad' } });
  }
};
