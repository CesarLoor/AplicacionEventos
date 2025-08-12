const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3002;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB (Eventos)');
    app.listen(PORT, () => console.log(`Servicio Eventos corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error al conectar a MongoDB', err));
