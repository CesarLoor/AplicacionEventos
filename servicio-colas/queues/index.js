const { Queue, QueueScheduler } = require('bullmq');

// Tipos de colas disponibles
const QUEUE_NAMES = {
  USERS: 'users',
  EVENTS: 'events',
  LOCALIDADES: 'localidades',
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails'
};

// Configuración por defecto para las colas
const DEFAULT_QUEUE_OPTIONS = {
  defaultJobOptions: {
    removeOnComplete: 1000, // Mantener 1000 trabajos completados
    removeOnFail: 5000,     // Mantener 5000 trabajos fallidos
    attempts: 3,            // Número de reintentos
    backoff: {
      type: 'exponential',  // Backoff exponencial
      delay: 1000,          // 1 segundo inicial
    },
  },
};

// Inicializar las colas
function setupQueues(redisConfig) {
  console.log('Configurando conexión a Redis con:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db
  });
  
  console.log('Versión de BullMQ instalada:', require('bullmq/package.json').version);
  
  const queues = {};
  
  try {
    // Crear instancias de Queue para cada tipo
    Object.values(QUEUE_NAMES).forEach(queueName => {
      console.log(`Creando cola: ${queueName}`);
      
      // Crear la cola
      queues[queueName] = new Queue(queueName, {
        connection: redisConfig,
        ...DEFAULT_QUEUE_OPTIONS,
      });
      
      // Crear un programador para la cola
      console.log(`Creando programador para la cola: ${queueName}`);
      const queueScheduler = new QueueScheduler(queueName, {
        connection: redisConfig,
      });
      
      // Manejar errores del programador
      queueScheduler.on('error', (error) => {
        console.error(`Error en el programador de la cola ${queueName}:`, error);
      });
      
      console.log(`✅ Cola configurada: ${queueName}`);
    });
    
    return queues;
  } catch (error) {
    console.error('Error al configurar las colas:', error);
    throw error; // Relanzar el error para manejarlo en el llamador
  }
}

// Función para agregar un trabajo a una cola
async function addJob(queue, name, data, options = {}) {
  try {
    const job = await queue.add(name, data, options);
    console.log(`✅ Trabajo agregado a la cola ${queue.name}: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`❌ Error al agregar trabajo a la cola ${queue.name}:`, error);
    throw error;
  }
}

module.exports = {
  QUEUE_NAMES,
  setupQueues,
  addJob,
};
