const { exec } = require('child_process');
const path = require('path');
const logger = require('./utils/logger');

// Configuración
const SERVICES = {
  API: 'node app.js',
  USER_WORKER: 'node workers/userWorker.js',
  EVENT_WORKER: 'node workers/eventWorker.js',
  LOCALIDAD_WORKER: 'node workers/localidadWorker.js',
};

// Almacenar referencias a los procesos
const processes = [];

// Función para iniciar un servicio
function startService(name, command) {
  logger.info(`🚀 Iniciando servicio: ${name}`);
  
  const process = exec(command, {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' },
  });
  
  // Capturar salida estándar
  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data}`);
  });
  
  // Capturar errores
  process.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data}`);
  });
  
  // Manejar cierre
  process.on('close', (code) => {
    console.log(`[${name}] Proceso terminado con código ${code}`);
    if (code !== 0) {
      console.log(`[${name}] Reiniciando servicio...`);
      startService(name, command); // Reiniciar el servicio si falla
    }
  });
  
  processes.push(process);
  return process;
}

// Manejar señales para un cierre limpio
function handleShutdown() {
  console.log('\n🛑 Recibida señal de apagado. Cerrando servicios...');
  
  // Detener todos los procesos
  processes.forEach((process, index) => {
    if (process) {
      console.log(`Deteniendo proceso ${index + 1}...`);
      process.kill();
    }
  });
  
  console.log('✅ Todos los servicios han sido detenidos.');
  process.exit(0);
}

// Capturar señales de terminación
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Iniciar todos los servicios
console.log('🚀 Iniciando todos los servicios...\n');

// Iniciar la API
exec('node app.js', { cwd: __dirname });

// Iniciar los workers con un pequeño retraso para asegurar que Redis esté listo
setTimeout(() => {
  Object.entries(SERVICES).forEach(([name, command]) => {
    // Ya iniciamos la API, así que la saltamos aquí
    if (name !== 'API') {
      startService(name, command);
    }
  });
  
  console.log('\n✅ Todos los servicios han sido iniciados.');
  console.log(`📊 Panel de control: http://localhost:4001/admin/queues`);
  console.log(`🔄 Para detener los servicios, presiona Ctrl+C\n`);
}, 2000);
