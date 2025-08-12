const express = require('express');
const { getAllLocalidades, getLocalidadById, getEventosByLocalidad,createLocalidad } = require('../controllers/localController');

const router = express.Router();

router.get('/', getAllLocalidades);
router.get('/:id', getLocalidadById);
router.get('/:id/eventos', getEventosByLocalidad);
router.post('/', createLocalidad);

module.exports = router;
