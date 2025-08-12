const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/usuarios', userRoutes);

app.get('/', (req, res) => res.send('Servicio de Usuarios funcionando 🚀'));

module.exports = app;
