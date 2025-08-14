# Aplicación Web de Eventos

Aplicación web escalable para la gestión de eventos, construida con una arquitectura de microservicios y utilizando GraphQL como capa de API unificada.

## 🚀 Características

- **Gestión de Usuarios**: Registro, autenticación y autorización de usuarios.
- **Gestión de Eventos**: Creación, actualización y consulta de eventos.
- **Sistema de Localidades**: Gestión de asientos y disponibilidad.
- **Sistema de Colas**: Manejo eficiente de solicitudes concurrentes para compra de boletos.
- **API Gateway**: Punto de entrada unificado con GraphQL.
- **Almacenamiento en caché**: Usando Redis para mejorar el rendimiento.
- **Base de datos**: MongoDB para almacenamiento persistente.

## 🏗️ Arquitectura

El proyecto sigue una arquitectura de microservicios con los siguientes componentes:

1. **Gateway GraphQL** (`gateway-graphql`): Punto de entrada principal de la API
2. **Servicio de Usuarios** (`servicio-usuarios`): Manejo de autenticación y perfiles
3. **Servicio de Eventos** (`servicio-eventos`): Gestión de eventos y sus detalles
4. **Servicio de Localidades** (`servicio-localidades`): Control de asientos y disponibilidad
5. **Servicio de Colas** (`servicio-colas`): Manejo de colas para compra de boletos
6. **Redis**: Para caché y manejo de colas
7. **MongoDB**: Base de datos principal

## 🛠️ Requisitos Previos

- Docker (versión 20.10.0 o superior)
- Docker Compose (versión 2.0.0 o superior)
- Node.js (versión 16 o superior)
- npm (versión 8 o superior)

## 🚀 Despliegue Local

Sigue estos pasos para desplegar la aplicación localmente:

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd AplicacionWebEventos
   ```

2. **Configurar variables de entorno**
   - Asegúrate de que los servicios tengan configuradas las variables de entorno necesarias en el archivo `docker-compose.yml`
   - Las variables sensibles como contraseñas y claves secretas deben manejarse de forma segura (usando variables de entorno o un gestor de secretos)

3. **Iniciar los contenedores**
   ```bash
   docker-compose up --build
   ```
   Esto construirá y ejecutará todos los servicios definidos en `docker-compose.yml`.

4. **Acceder a la aplicación**
   - **API GraphQL**: http://localhost:4000/graphql
   - **Servicio de Usuarios**: http://localhost:3001
   - **Servicio de Eventos**: http://localhost:3002
   - **Servicio de Localidades**: http://localhost:3003
   - **Servicio de Colas**: http://localhost:4001
   - **Redis**: localhost:6379
   - **MongoDB**: localhost:27017

## 🧪 Pruebas

El proyecto incluye pruebas de carga utilizando Locust. Para ejecutarlas:

1. Asegúrate de que todos los servicios estén en ejecución
2. Instala Locust si no lo tienes:
   ```bash
   pip install locust
   ```
3. Navega al directorio de pruebas y ejecuta:
   ```bash
   locust -f test_script.py
   ```
4. Abre http://localhost:8089 en tu navegador para ver la interfaz de Locust

## 📦 Estructura del Proyecto

```
AplicacionWebEventos/
├── gateway-graphql/      # API Gateway con GraphQL
├── servicio-usuarios/    # Servicio de autenticación y perfiles
├── servicio-eventos/     # Servicio de gestión de eventos
├── servicio-localidades/ # Gestión de localidades y asientos
├── servicio-colas/       # Manejo de colas para compra de boletos
└── docker-compose.yml    # Configuración de Docker Compose
```

## 🔒 Seguridad

- Autenticación basada en JWT
- Variables sensibles manejadas a través de variables de entorno
- Conexiones seguras a la base de datos
- Validación de entrada en todos los endpoints

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee las guías de contribución antes de enviar pull requests.

## 📧 Contacto

Para preguntas o soporte, por favor contacta al equipo de desarrollo.
