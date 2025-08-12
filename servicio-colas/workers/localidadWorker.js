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
const localidadQueueScheduler = new QueueScheduler(QUEUE_NAMES.LOCALIDADES, {
  connection: redisConfig,
});

// Manejar errores del programador de la cola
localidadQueueScheduler.on('error', (error) => {
  logger.error('Error en el programador de la cola de localidades:', {
    error: error.message,
    stack: error.stack
  });
});

// Inicializar el worker
const localidadWorker = new Worker(
  QUEUE_NAMES.LOCALIDADES,
  async job => {
    const { name, data } = job;
    
    logger.info(`Procesando trabajo de localidad: ${name}`, { jobId: job.id, data });
    
    try {
      switch (name) {
        case 'localidadCreated':
          await handleLocalidadCreated(data);
          break;
          
        case 'localidadUpdated':
          await handleLocalidadUpdated(data);
          break;
          
        case 'localidadDeleted':
          await handleLocalidadDeleted(data);
          break;
          
        case 'updateCapacity':
          await handleUpdateCapacity(data);
          break;
          
        default:
          logger.warn(`Tipo de trabajo no reconocido: ${name}`, { jobId: job.id });
          throw new Error(`Tipo de trabajo no reconocido: ${name}`);
      }
      
      logger.info(`Trabajo de localidad completado: ${job.id}`, { jobId: job.id, name });
      return { success: true, jobId: job.id };
      
    } catch (error) {
      logger.error(`Error al procesar trabajo de localidad ${job.id}:`, { 
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
      max: parseInt(process.env.QUEUE_MAX_JOBS_PER_SECOND || '15'), // Más alto porque las actualizaciones de localidades pueden ser frecuentes
      duration: 1000
    }
  }
);

// Manejadores de trabajos específicos
async function handleLocalidadCreated(data) {
  const { localidadId, nombre, capacidad, eventoId } = data;
  logger.info(`Procesando creación de localidad: ${nombre}`, { 
    localidadId, 
    capacidad,
    eventoId
  });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Aquí iría la lógica real, como:
  // - Actualizar índices de búsqueda
  // - Notificar a los servicios relevantes
  // - Inicializar métricas
  
  logger.info(`Localidad creada procesada: ${nombre}`, { localidadId });
}

async function handleLocalidadUpdated(data) {
  const { localidadId, cambios, actualizadoPor } = data;
  logger.info(`Actualizando localidad: ${localidadId}`, { 
    cambios, 
    actualizadoPor 
  });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Aquí iría la lógica real de actualización
  
  logger.info(`Localidad actualizada: ${localidadId}`);
}

async function handleLocalidadDeleted(data) {
  const { localidadId, eventoId, motivo, eliminadoPor } = data;
  logger.info(`Eliminando localidad: ${localidadId} del evento ${eventoId}`, { 
    motivo, 
    eliminadoPor 
  });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Aquí iría la lógica real de eliminación
  
  logger.info(`Localidad eliminada: ${localidadId}`);
}

async function handleUpdateCapacity(data) {
  const { localidadId, eventoId, nuevaCapacidad, asientosReservados } = data;
  logger.info(`Actualizando capacidad de localidad: ${localidadId}`, {
    eventoId,
    nuevaCapacidad,
    asientosReservados
  });
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Aquí iría la lógica real de actualización de capacidad
  // - Validar que la nueva capacidad no sea menor a los asientos ya reservados
  // - Actualizar la base de datos
  // - Notificar a los servicios relevantes
  
  logger.info(`Capacidad de localidad actualizada: ${localidadId}`, {
    eventoId,
    nuevaCapacidad
  });
}

// Manejo de eventos del worker
localidadWorker.on('completed', (job) => {
  logger.info(`Trabajo de localidad completado: ${job.id} (${job.name})`, {
    jobId: job.id,
    name: job.name,
    data: job.data
  });
});

localidadWorker.on('failed', (job, error) => {
  logger.error(`Fallo en trabajo de localidad ${job?.id} (${job?.name}): ${error.message}`, {
    jobId: job?.id,
    name: job?.name,
    error: error.message,
    stack: error.stack,
    data: job?.data
  });
  
  // Notificar al equipo si se agotan los reintentos
  if (job?.attemptsMade >= job?.opts?.attempts) {
    logger.error(`Trabajo de localidad agotó todos los reintentos: ${job.id}`, {
      jobId: job.id,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      data: job.data
    });
    // Aquí podrías enviar una notificación al equipo
  }
});

localidadWorker.on('error', (error) => {
  logger.error('Error en el worker de localidades:', {
    error: error.message,
    stack: error.stack
  });
});

logger.info('👷 Worker de localidades iniciado. Esperando trabajos...');

// Manejo de señales para un cierre limpio
const shutdown = async () => {
  logger.info('🛑 Deteniendo worker de localidades...');
  await localidadWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
