const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const eventRoutes = require('./routes/eventRoutes');

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/eventos', eventRoutes);

app.get('/', (req, res) => res.send('Servicio de Eventos funcionando 🚀'));

module.exports = app;
