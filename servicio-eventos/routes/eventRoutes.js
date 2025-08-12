const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, isOrganizer, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, isOrganizer, createEvent);
router.put('/:id', protect, isOrganizer, updateEvent);
router.delete('/:id', protect, isAdmin, deleteEvent);

module.exports = router;
