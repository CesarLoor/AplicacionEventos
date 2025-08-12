const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB (Localidades)');
    app.listen(PORT, () => console.log(`Servicio Localidades corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error al conectar a MongoDB', err));
