const { Worker, QueueScheduler } = require('bullmq');
const { QUEUE_NAMES } = require('../queues');
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
const userQueueScheduler = new QueueScheduler(QUEUE_NAMES.USERS, {
  connection: redisConfig,
});

// Manejar errores del programador de la cola
userQueueScheduler.on('error', (error) => {
  console.error('Error en el programador de la cola de usuarios:', error);
});

// Inicializar el worker
const userWorker = new Worker(
  QUEUE_NAMES.USERS,
  async job => {
    const { name, data } = job;
    
    console.log(`🔍 Procesando trabajo: ${name}`, data);
    
    try {
      switch (name) {
        case 'userRegistered':
          await handleUserRegistered(data);
          break;
          
        case 'passwordReset':
          await handlePasswordReset(data);
          break;
          
        case 'profileUpdated':
          await handleProfileUpdated(data);
          break;
          
        default:
          console.warn(`⚠️ Tipo de trabajo no reconocido: ${name}`);
          throw new Error(`Tipo de trabajo no reconocido: ${name}`);
      }
      
      console.log(`✅ Trabajo completado: ${job.id}`);
      return { success: true, jobId: job.id };
      
    } catch (error) {
      console.error(`❌ Error al procesar trabajo ${job.id}:`, error);
      throw error; // Re-lanzar para que BullMQ maneje los reintentos
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // Número de trabajos concurrentes
    limiter: {
      max: 10,       // Máximo de trabajos por intervalo
      duration: 1000 // 1 segundo
    }
  }
);

// Manejadores de trabajos específicos
async function handleUserRegistered(data) {
  const { email, nombre } = data;
  console.log(`📧 Enviando correo de bienvenida a ${email} (${nombre})`);
  
  // Simular envío de correo (reemplazar con implementación real)
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`✅ Correo de bienvenida enviado a ${email}`);
  
  // Aquí iría la lógica real de envío de correo
  // Ejemplo con nodemailer o servicio de correo
}

async function handlePasswordReset(data) {
  const { email } = data;
  console.log(`🔑 Enviando correo de restablecimiento a ${email}`);
  
  // Simular envío de correo
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`✅ Correo de restablecimiento enviado a ${email}`);
}

async function handleProfileUpdated(data) {
  const { userId, changes } = data;
  console.log(`🔄 Actualizando perfil del usuario ${userId} con cambios:`, changes);
  
  // Simular actualización
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(`✅ Perfil del usuario ${userId} actualizado`);
}

// Manejo de eventos del worker
userWorker.on('completed', (job) => {
  console.log(`✅ Trabajo completado: ${job.id} (${job.name})`);
});

userWorker.on('failed', (job, error) => {
  console.error(`❌ Falló trabajo ${job?.id} (${job?.name}):`, error.message);
  
  // Aquí podrías implementar lógica de notificación o reintentos personalizados
  if (job.attemptsMade >= job.opts.attempts) {
    console.error(`❌ Trabajo agotó todos los reintentos: ${job.id}`);
    // Opcional: Enviar notificación al equipo
  }
});

userWorker.on('error', (error) => {
  console.error('❌ Error en el worker de usuarios:', error);
  // Aquí podrías implementar notificaciones o reinicio del worker
});

console.log('👷 Worker de usuarios iniciado. Esperando trabajos...');

// Manejo de señales para un cierre limpio
const shutdown = async () => {
  console.log('🛑 Deteniendo worker de usuarios...');
  await userWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
