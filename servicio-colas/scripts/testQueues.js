const { addJob, QUEUE_NAMES } = require('../utils/queueClient');
const logger = require('../utils/logger');

// Función para generar un ID aleatorio
function generateId(prefix = '') {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Datos de prueba
const testData = {
  user: {
    email: `testuser_${Date.now()}@example.com`,
    nombre: 'Usuario de Prueba',
    rol: 'USUARIO',
  },
  event: {
    titulo: 'Evento de Prueba',
    descripcion: 'Este es un evento de prueba',
    fechaHora: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dentro de 7 días
    ubicacion: 'Ubicación de Prueba',
    creadoPor: 'testuser@example.com',
  },
  localidad: {
    nombre: 'Localidad de Prueba',
    capacidad: 100,
    precio: 50.00,
    eventoId: generateId('event'),
  },
};

// Función para probar el envío de trabajos a las colas
async function testQueues() {
  try {
    logger.info('🚀 Iniciando pruebas de colas...');
    
    // 1. Probar cola de usuarios
    logger.info('\n📋 Probando cola de usuarios...');
    const userJob = await addJob(
      QUEUE_NAMES.USERS,
      'userRegistered',
      {
        userId: generateId('user'),
        email: testData.user.email,
        nombre: testData.user.nombre,
        rol: testData.user.rol,
      },
      { priority: 1 } // Alta prioridad
    );
    
    // 2. Probar cola de eventos
    logger.info('\n🎭 Probando cola de eventos...');
    const eventId = generateId('event');
    const eventJob = await addJob(
      QUEUE_NAMES.EVENTS,
      'eventCreated',
      {
        eventId,
        titulo: testData.event.titulo,
        descripcion: testData.event.descripcion,
        creadoPor: testData.event.creadoPor,
      },
      { delay: 1000 } // Retraso de 1 segundo
    );
    
    // 3. Probar cola de localidades
    logger.info('\n🏟️ Probando cola de localidades...');
    const localidadId = generateId('localidad');
    const localidadJob = await addJob(
      QUEUE_NAMES.LOCALIDADES,
      'localidadCreated',
      {
        localidadId,
        nombre: testData.localidad.nombre,
        capacidad: testData.localidad.capacidad,
        eventoId: eventId, // Usar el mismo ID de evento generado anteriormente
      },
      { priority: 2 } // Prioridad media
    );
    
    // 4. Probar actualización de capacidad
    logger.info('\n🔄 Probando actualización de capacidad...');
    await addJob(
      QUEUE_NAMES.LOCALIDADES,
      'updateCapacity',
      {
        localidadId,
        eventoId,
        nuevaCapacidad: 150,
        asientosReservados: 50,
      },
      { delay: 2000 } // Retraso de 2 segundos
    );
    
    logger.info('\n✅ Todas las pruebas se han enviado a las colas');
    logger.info('Revisa los logs de los workers para ver el procesamiento');
    
  } catch (error) {
    logger.error('❌ Error en las pruebas de colas:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  testQueues()
    .then(() => {
      // Esperar un momento para que los trabajos se procesen
      setTimeout(() => process.exit(0), 5000);
    })
    .catch(error => {
      console.error('Error en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testQueues };
