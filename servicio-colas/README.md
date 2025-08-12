# Servicio de Colas para Aplicación de Eventos

Este servicio maneja el procesamiento asíncrono de tareas para la aplicación de eventos utilizando colas de mensajes con BullMQ y Redis.

## 🚀 Características

- Procesamiento asíncrono de tareas
- Múltiples colas para diferentes tipos de trabajos
- Reintentos automáticos con backoff exponencial
- Panel de control para monitoreo (Bull Board)
- Manejo de errores robusto
- Logs detallados
- Métricas de rendimiento

## 🏗️ Estructura del Proyecto

```
servicio-colas/
├── .env                    # Variables de entorno
├── app.js                 # Aplicación principal
├── package.json           # Dependencias y scripts
├── queues/                # Configuración de colas
│   └── index.js           # Configuración centralizada de colas
├── workers/               # Workers para procesar trabajos
│   ├── userWorker.js      # Worker para tareas de usuarios
│   ├── eventWorker.js     # Worker para tareas de eventos
│   └── localidadWorker.js # Worker para tareas de localidades
├── utils/                 # Utilidades
│   ├── logger.js          # Configuración de logs
│   └── queueClient.js     # Cliente para interactuar con las colas
└── scripts/               # Scripts de utilidad
    └── testQueues.js      # Script para probar las colas
```

## 🛠️ Configuración

### Requisitos

- Node.js >= 16.0.0
- Redis >= 6.0.0
- npm o yarn

### Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Copia el archivo `.env.example` a `.env` y configura las variables de entorno:

```bash
cp .env.example .env
```

4. Asegúrate de tener Redis corriendo en el puerto configurado (por defecto 6379)

## 🚦 Uso

### Iniciar el servicio de colas

```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start

# Iniciar solo los workers
npm run start:workers

# Iniciar todo (API + workers)
npm run start:all
```

### Panel de control

Accede al panel de control de Bull Board en:
- http://localhost:4001/admin/queues

### Endpoints

- `GET /` - Página de inicio
- `GET /health` - Estado del servicio
- `GET /admin/queues` - Panel de control de colas

## 🧪 Pruebas

Para probar el envío de trabajos a las colas:

```bash
node scripts/testQueues.js
```

## 📊 Monitoreo

El servicio expone métricas en formato Prometheus en:
- http://localhost:4001/metrics

## 🛡️ Manejo de Errores

- Los trabajos fallidos se reintentan automáticamente (3 intentos por defecto)
- Los errores se registran en los archivos de log
- Se envían notificaciones cuando un trabajo agota todos los reintentos

## 📝 Licencia

MIT
