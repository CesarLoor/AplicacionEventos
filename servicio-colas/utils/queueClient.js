const { Queue } = require('bullmq');
const { QUEUE_NAMES } = require('../queues');
const logger = require('./logger');

// Configuración de Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Cache para las instancias de colas
const queues = {};

/**
 * Obtiene una instancia de cola por su nombre
 * @param {string} queueName - Nombre de la cola (debe ser uno de QUEUE_NAMES)
 * @returns {Queue} Instancia de la cola
 */
function getQueue(queueName) {
  if (!Object.values(QUEUE_NAMES).includes(queueName)) {
    throw new Error(`Nombre de cola no válido: ${queueName}`);
  }
  
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, { connection: redisConfig });
    logger.info(`🔌 Conexión establecida con la cola: ${queueName}`);
  }
  
  return queues[queueName];
}

/**
 * Agrega un trabajo a una cola
 * @param {string} queueName - Nombre de la cola
 * @param {string} jobName - Nombre del trabajo
 * @param {Object} data - Datos del trabajo
 * @param {Object} options - Opciones del trabajo (opcional)
 * @returns {Promise<Object>} Información del trabajo agregado
 */
async function addJob(queueName, jobName, data, options = {}) {
  try {
    const queue = getQueue(queueName);
    const job = await queue.add(jobName, data, {
      removeOnComplete: 1000, // Mantener 1000 trabajos completados
      removeOnFail: 5000,     // Mantener 5000 trabajos fallidos
      attempts: 3,            // Número de reintentos
      backoff: {
        type: 'exponential',  // Backoff exponencial
        delay: 1000,          // 1 segundo inicial
      },
      ...options, // Sobrescribir con opciones personalizadas
    });
    
    logger.info(`✅ Trabajo agregado a la cola ${queueName}: ${job.id}`, {
      jobId: job.id,
      name: jobName,
      queue: queueName,
      data,
    });
    
    return {
      success: true,
      jobId: job.id,
      queue: queueName,
      name: jobName,
    };
  } catch (error) {
    logger.error(`❌ Error al agregar trabajo a la cola ${queueName}:`, {
      error: error.message,
      stack: error.stack,
      queue: queueName,
      jobName,
      data,
    });
    
    throw error;
  }
}

/**
 * Obtiene información de un trabajo por su ID
 * @param {string} queueName - Nombre de la cola
 * @param {string} jobId - ID del trabajo
 * @returns {Promise<Object>} Información del trabajo
 */
async function getJob(queueName, jobId) {
  try {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Trabajo no encontrado: ${jobId} en la cola ${queueName}`);
    }
    
    const state = await job.getState();
    
    return {
      id: job.id,
      name: job.name,
      state,
      progress: job.progress,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error(`Error al obtener trabajo ${jobId} de la cola ${queueName}:`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Obtiene las métricas de una cola
 * @param {string} queueName - Nombre de la cola
 * @returns {Promise<Object>} Métricas de la cola
 */
async function getQueueMetrics(queueName) {
  try {
    const queue = getQueue(queueName);
    const [
      waiting,   // En espera
      active,    // En proceso
      completed, // Completados
      failed,    // Fallidos
      delayed,   // Retrasados
      paused,    // Pausados
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed + paused,
    };
  } catch (error) {
    logger.error(`Error al obtener métricas de la cola ${queueName}:`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  getQueue,
  addJob,
  getJob,
  getQueueMetrics,
  QUEUE_NAMES,
};
