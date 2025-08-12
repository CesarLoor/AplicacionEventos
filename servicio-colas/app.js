console.log('Iniciando servicio de colas...');

// Cargar variables de entorno
require('dotenv').config();

// Importar dependencias
const express = require('express');
const { Queue } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

// Configuración básica
const app = express();
const PORT = process.env.PORT || 4001;

// Configuración de Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

// Nombres de las colas
const QUEUE_NAMES = {
  USERS: 'users',
  EVENTS: 'events',
  LOCALIDADES: 'localidades',
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails'
};

// Crear instancias de las colas
const queues = {};
Object.values(QUEUE_NAMES).forEach(queueName => {
  queues[queueName] = new Queue(queueName, { connection: redisConfig });
  console.log(`✅ Cola creada: ${queueName}`);
});

// Configurar el panel de control de Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const bullBoardQueues = Object.entries(queues).map(([name, queue]) => ({
  name,
  hostId: `Queue: ${name}`,
  bull: queue
}));

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: bullBoardQueues.map(queue => new BullMQAdapter(queue.bull)),
  serverAdapter: serverAdapter,
});

// Middleware
app.use(express.json());

// Ruta para el panel de control
app.use('/admin/queues', serverAdapter.getRouter());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send(`
    <h1>Servicio de Colas</h1>
    <p>Estado: <span style="color: green;">Activo</span></p>
    <p><a href="/admin/queues">Panel de control de colas</a></p>
    <p>Colas disponibles: ${Object.keys(QUEUE_NAMES).join(', ')}</p>
  `);
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      status: 'connected'
    },
    queues: Object.keys(queues)
  });
});

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servicio de colas iniciado en http://localhost:${PORT}`);
  console.log(`📊 Panel de control: http://localhost:${PORT}/admin/queues`);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = { app, server, queues };
