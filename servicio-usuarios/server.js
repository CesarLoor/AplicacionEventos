const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB (Usuarios)');
    app.listen(PORT, () => console.log(`Servicio Usuarios corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error al conectar a MongoDB', err));
