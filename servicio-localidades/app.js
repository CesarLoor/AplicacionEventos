const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const localidadRoutes = require('./routes/localRoutes');

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/localidades', localidadRoutes);

app.get('/', (req, res) => res.send('Servicio de Localidades funcionando 🚀'));

module.exports = app;
