const { Worker, QueueScheduler } = require('bullmq');
const { QUEUE_NAMES } = require('../queues');
const logger = require('../utils/logger');
require('dotenv').config();

// Configuración de Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Inicializar el programador de la cola
const eventQueueScheduler = new QueueScheduler(QUEUE_NAMES.EVENTS, {
  connection: redisConfig,
});

// Manejar errores del programador de la cola
eventQueueScheduler.on('error', (error) => {
  logger.error('Error en el programador de la cola de eventos:', {
    error: error.message,
    stack: error.stack
  });
});

// Inicializar el worker
const eventWorker = new Worker(
  QUEUE_NAMES.EVENTS,
  async job => {
    const { name, data } = job;
    
    logger.info(`Procesando trabajo de evento: ${name}`, { jobId: job.id, data });
    
    try {
      switch (name) {
        case 'eventCreated':
          await handleEventCreated(data);
          break;
          
        case 'eventUpdated':
          await handleEventUpdated(data);
          break;
          
        case 'eventDeleted':
          await handleEventDeleted(data);
          break;
          
        case 'eventReminder':
          await handleEventReminder(data);
          break;
          
        default:
          logger.warn(`Tipo de trabajo no reconocido: ${name}`, { jobId: job.id });
          throw new Error(`Tipo de trabajo no reconocido: ${name}`);
      }
      
      logger.info(`Trabajo de evento completado: ${job.id}`, { jobId: job.id, name });
      return { success: true, jobId: job.id };
      
    } catch (error) {
      logger.error(`Error al procesar trabajo de evento ${job.id}:`, { 
        jobId: job.id, 
        error: error.message, 
        stack: error.stack 
      });
      throw error; // Re-lanzar para que BullMQ maneje los reintentos
    }
  },
  {
    connection: redisConfig,
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
    limiter: {
      max: parseInt(process.env.QUEUE_MAX_JOBS_PER_SECOND || '10'),
      duration: 1000
    }
  }
);

// Manejadores de trabajos específicos
async function handleEventCreated(data) {
  const { eventId, titulo, creadoPor } = data;
  logger.info(`Procesando creación de evento: ${titulo}`, { eventId, creadoPor });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Aquí iría la lógica real, como:
  // - Enviar notificaciones a usuarios suscritos
  // - Actualizar índices de búsqueda
  // - Procesar imágenes o archivos adjuntos
  
  logger.info(`Evento creado procesado: ${titulo}`, { eventId });
}

async function handleEventUpdated(data) {
  const { eventId, cambios, actualizadoPor } = data;
  logger.info(`Actualizando evento: ${eventId}`, { cambios, actualizadoPor });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Aquí iría la lógica real de actualización
  
  logger.info(`Evento actualizado: ${eventId}`);
}

async function handleEventDeleted(data) {
  const { eventId, motivo, eliminadoPor } = data;
  logger.info(`Eliminando evento: ${eventId}`, { motivo, eliminadoPor });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Aquí iría la lógica real de eliminación
  
  logger.info(`Evento eliminado: ${eventId}`);
}

async function handleEventReminder(data) {
  const { eventId, titulo, fechaHora, usuarios } = data;
  logger.info(`Enviando recordatorio para el evento: ${titulo}`, { 
    eventId, 
    fechaHora,
    totalUsuarios: usuarios.length 
  });
  
  // Simular envío de recordatorios
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Aquí iría la lógica real de envío de recordatorios
  
  logger.info(`Recordatorios enviados para el evento: ${titulo}`, { 
    eventId,
    totalUsuarios: usuarios.length 
  });
}

// Manejo de eventos del worker
eventWorker.on('completed', (job) => {
  logger.info(`Trabajo de evento completado: ${job.id} (${job.name})`, {
    jobId: job.id,
    name: job.name,
    data: job.data
  });
});

eventWorker.on('failed', (job, error) => {
  logger.error(`Fallo en trabajo de evento ${job?.id} (${job?.name}): ${error.message}`, {
    jobId: job?.id,
    name: job?.name,
    error: error.message,
    stack: error.stack,
    data: job?.data
  });
  
  // Notificar al equipo si se agotan los reintentos
  if (job?.attemptsMade >= job?.opts?.attempts) {
    logger.error(`Trabajo de evento agotó todos los reintentos: ${job.id}`, {
      jobId: job.id,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      data: job.data
    });
    // Aquí podrías enviar una notificación al equipo
  }
});

eventWorker.on('error', (error) => {
  logger.error('Error en el worker de eventos:', {
    error: error.message,
    stack: error.stack
  });
});

logger.info('👷 Worker de eventos iniciado. Esperando trabajos...');

// Manejo de señales para un cierre limpio
const shutdown = async () => {
  logger.info('🛑 Deteniendo worker de eventos...');
  await eventWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
