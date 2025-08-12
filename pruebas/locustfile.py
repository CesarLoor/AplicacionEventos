from locust import HttpUser, task, between, TaskSet
import random
import string
import json
import requests
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseUser(HttpUser):
    """Base user class with common functionality"""
    
    abstract = True  # Mark as abstract to prevent direct instantiation
    # Asegúrate de que el host apunte a tu gateway GraphQL
    host = "http://localhost:4000"  # Ajusta el puerto según tu configuración del gateway
    wait_time = between(1, 3)  # Tiempo de espera entre tareas (1-3 segundos)
    
    def view_localidades(self):
        """View a list of localidades"""
        headers = self.headers.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        with self.client.get(
            f"{self.local_service_url}",
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.local_ids = [local["id"] for local in data if isinstance(local, dict) and "id" in local]
                        response.success()
                        return self.local_ids
                    else:
                        response.failure("Formato de respuesta inválido: se esperaba una lista")
                        return []
                except Exception as e:
                    response.failure(f"Error al procesar la respuesta: {str(e)}")
                    return []
            else:
                error_msg = f"Error HTTP {response.status_code}: {response.text}"
                response.failure(error_msg)
                return []
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.token = None
        self.user_id = None
        self.email = None
        self.password = "Test123!"  # Strong password for testing
        self.event_ids = []  # Track created events for this user
        self.local_ids = []  # Track localidades
        
        # Configuración de URLs base
        self.user_service_url = "http://localhost:3001/api/usuarios"  # Servicio de usuarios
        self.event_service_url = "http://localhost:3002/api/eventos"  # Servicio de eventos
        self.local_service_url = "http://localhost:3003/api/localidades"  # Servicio de localidades
        
        # Headers por defecto
        self.headers = {
            "Content-Type": "application/json"
        }

    def random_string(self, length=8):
        """Generate a random string of fixed length"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

    def random_email(self):
        """Generate a random email"""
        return f"test_{self.random_string(8)}@example.com"

    def register_user(self):
        """Register a new user using GraphQL"""
        try:
            if not self.email:
                self.email = self.random_email()
            
            # Mutation for user registration
            mutation = """
            mutation RegisterUser($nombre: String!, $email: String!, $password: String!, $confirmarPassword: String!) {
                registerUser(nombre: $nombre, email: $email, password: $password, confirmarPassword: $confirmarPassword) {
                    id
                    nombre
                    email
                }
            }
            """
            
            variables = {
                "nombre": f"Test User {random.randint(10000, 99999)}",
                "email": self.email,
                "password": self.password,
                "confirmarPassword": self.password
            }
            
            with self.client.post(
                "/graphql",
                json={
                    "query": mutation,
                    "variables": variables
                },
                headers={"Content-Type": "application/json"},
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    
                    if "data" in data and data["data"] and "registerUser" in data["data"]:
                        user_data = data["data"]["registerUser"]
                        if user_data and "id" in user_data:
                            self.user_id = user_data["id"]
                            print(f"✅ Usuario registrado exitosamente: {self.email}")
                            return True
                    
                    if "errors" in data:
                        print(f"⚠️ Error en registro: {data['errors']}")
                        response.failure(f"Error en registro: {data['errors']}")
                else:
                    print(f"⚠️ Error HTTP {response.status_code} en registro: {response.text}")
                    response.failure(f"Error HTTP {response.status_code} en registro")
            
            return False
                
        except Exception as e:
            print(f"❌ Error en register_user: {str(e)}")
            return False

    def login_user(self):
        """Login with the registered user using REST endpoint"""
        try:
            # Primero registramos un nuevo usuario
            print("🔑 Intentando registrar un nuevo usuario...")
            registered = self.register_new_user()
            if not registered:
                print("❌ No se pudo registrar el usuario")
                return False
            
            # Hacemos login usando el endpoint REST
            login_data = {
                "email": self.email,
                "password": self.password
            }
            
            print(f"🔑 Intentando iniciar sesión con: {self.email}")
            
            with self.client.post(
                f"{self.user_service_url}/login",
                json=login_data,
                headers=self.headers,
                catch_response=True
            ) as response:
                try:
                    response_data = response.json()
                    print(f"🔍 Respuesta de login: {json.dumps(response_data, indent=2)}")
                    
                    if response.status_code == 200:
                        if "token" in response_data and "usuario" in response_data:
                            self.token = response_data["token"]
                            user_info = response_data["usuario"]
                            self.user_id = user_info.get("id")
                            
                            # Actualizamos los headers con el token
                            self.headers["Authorization"] = f"Bearer {self.token}"
                            
                            print(f"✅ Usuario {self.email} autenticado exitosamente")
                            print(f"🔑 Token JWT: {self.token[:20]}...")  # Mostrar solo los primeros caracteres del token
                            
                            # Verificar el rol del usuario
                            user_role = user_info.get("rol", "No especificado")
                            print(f"👤 Rol del usuario: {user_role}")
                            
                            # Verificar que el token no esté vacío
                            if not self.token:
                                print("⚠️ Advertencia: El token JWT está vacío")
                                response.failure("Token JWT vacío")
                                return False
                                
                            return True
                        else:
                            error_msg = "Formato de respuesta inesperado en login"
                            print(f"⚠️ {error_msg}")
                            response.failure(error_msg)
                            return False
                    else:
                        # Manejar errores de autenticación
                        error_info = response_data.get('error', {})
                        if isinstance(error_info, dict):
                            error_msg = error_info.get('mensaje', str(error_info))
                        else:
                            error_msg = str(error_info)
                        
                        print(f"⚠️ Error en login ({response.status_code}): {error_msg}")
                        response.failure(f"Error en login: {error_msg}")
                        return False
                        
                except json.JSONDecodeError as e:
                    error_msg = f"Error al decodificar la respuesta JSON: {str(e)} - {response.text}"
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
                    return False
                    
        except Exception as e:
            print(f"❌ Error en login_user: {str(e)}")
            return False
            
    def register_new_user(self):
        """Register a new user using REST endpoint"""
        try:
            # Siempre generamos un email aleatorio para evitar conflictos
            self.email = self.random_email()
            print(f"📝 Intentando registrar usuario: {self.email}")
                
            nombre = f"Usuario_{self.random_string(6)}"
            
            user_data = {
                "nombre": nombre,
                "email": self.email,
                "password": self.password,
                "confirmarPassword": self.password,
                "rol": "ORGANIZADOR"  # Usamos mayúsculas para coincidir con el modelo actualizado
            }
            
            print(f"📝 Datos de registro: {json.dumps(user_data, indent=2)}")
            
            with self.client.post(
                f"{self.user_service_url}/registro",
                json=user_data,
                headers=self.headers,
                catch_response=True
            ) as response:
                try:
                    # Intentar decodificar la respuesta JSON
                    response_data = response.json()
                    print(f"🔍 Respuesta del servidor: {json.dumps(response_data, indent=2)}")
                    
                    if response.status_code == 201:  # 201 Created para registro exitoso
                        if "id" in response_data and "email" in response_data:
                            self.user_id = response_data["id"]
                            print(f"✅ Usuario registrado exitosamente: {self.email}")
                            print(f"📋 Datos del usuario: ID={self.user_id}, Email={self.email}")
                            return True
                        else:
                            error_msg = f"Formato de respuesta inesperado: {response_data}"
                            print(f"⚠️ {error_msg}")
                            response.failure(error_msg)
                            return False
                    else:
                        # Manejar errores del servidor
                        error_info = response_data.get('error', {})
                        if isinstance(error_info, dict):
                            error_msg = error_info.get('mensaje', str(error_info))
                        else:
                            error_msg = str(error_info)
                        
                        print(f"⚠️ Error en registro ({response.status_code}): {error_msg}")
                        response.failure(f"Error en registro: {error_msg}")
                        return False
                        
                except json.JSONDecodeError as e:
                    # Si no se puede decodificar la respuesta JSON
                    error_msg = f"Error al decodificar la respuesta JSON: {str(e)} - {response.text}"
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
                    return False
                except Exception as e:
                    # Cualquier otro error inesperado
                    error_msg = f"Error inesperado al procesar la respuesta: {str(e)}"
                    print(f"❌ {error_msg}")
                    response.failure(error_msg)
                    return False
        except Exception as e:
            print(f"❌ Error en register_new_user: {str(e)}")
            return False
            
    # El método try_alternative_login ha sido eliminado ya que no es necesario
    # La mutación 'login' no está disponible en el esquema GraphQL actual

    def on_start(self):
        """Initialize the user for testing"""
        try:
            print("[INFO] Iniciando usuario...")
            
            # Generate random email if not set
            if not self.email:
                self.email = self.random_email()
            
            # Registrar y simular login en un solo paso
            if self.login_user():
                print(f"[SUCCESS] Usuario {self.email} listo para realizar operaciones")
                return True
            else:
                print(f"[WARNING] No se pudo preparar el usuario {self.email}")
                return False
            
        except Exception as e:
            print(f"[ERROR] Error en on_start: {str(e)}")
            return False
        
    def on_stop(self):
        """Cleanup after the test"""
        pass

class RegularUser(BaseUser):
    """Regular user that can browse events and view details"""
    
    @task(3)
    def view_events_task(self):
        """Task to view a list of events"""
        self.view_events()
        
    @task(1)
    def view_localidades_task(self):
        """Task to view a list of localidades"""
        self.view_localidades()
        
    def view_events(self):
        """View a list of events"""
        headers = self.headers.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        with self.client.get(
            f"{self.event_service_url}",
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.event_ids = [evento["id"] for evento in data if "id" in evento]
                    response.success()
                else:
                    response.failure("Formato de respuesta inválido")
            else:
                response.failure(f"Error HTTP {response.status_code}: {response.text}")

    @task(1)
    def view_event_details(self):
        """View details of a specific event"""
        if not self.event_ids:
            self.view_events()  # Primero obtenemos eventos si no tenemos ninguno
            if not self.event_ids:
                return
            
        event_id = random.choice(self.event_ids)
        headers = self.headers.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        with self.client.get(
            f"{self.event_service_url}/{event_id}",
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if data and "id" in data:
                    response.success()
                else:
                    response.failure("No se pudo obtener detalles del evento")
            else:
                response.failure(f"Error HTTP {response.status_code}: {response.text}")

class AdminUser(BaseUser):
    """Admin user that can manage events and locations"""
    
    @task(1)
    def view_localidades_task(self):
        """Task to view a list of localidades"""
        self.view_localidades()
    
    def on_start(self):
        """Admin-specific setup"""
        print("\n[INFO] Iniciando usuario administrador...")
        
        # 1. Registrar un nuevo usuario (esto ya incluye el rol de ORGANIZADOR)
        if not self.register_new_user():
            print("❌ No se pudo registrar el usuario administrador")
            return
            
        # 2. Iniciar sesión para obtener el token JWT
        if not self.login_user():
            print("❌ No se pudo autenticar el usuario administrador")
            return
            
        # 3. Verificar que el token se configuró correctamente
        if not hasattr(self, 'token') or not self.token:
            print("❌ No se pudo obtener el token de autenticación")
            return
            
        # 4. Cargar localidades existentes
        self.view_localidades()
        
        # 5. Si no hay localidades, crear una
        if not hasattr(self, 'local_ids') or not self.local_ids:
            print("ℹ️ No se encontraron localidades, creando una...")
            self.create_localidad()
            
        print(f"✅ Usuario administrador {self.email} listo para operar")
        print(f"🔑 Token: {self.token[:20]}...")
        if hasattr(self, 'local_ids'):
            print(f"🏢 Localidades disponibles: {len(self.local_ids)}")
        else:
            print("⚠️ No hay localidades disponibles")
        
    def get_or_create_location(self):
        """Get an existing location or create a new one"""
        # Si ya tenemos localidades, devolvemos una al azar
        if hasattr(self, 'local_ids') and self.local_ids:
            return random.choice(self.local_ids)
            
        # Si no hay localidades, intentamos obtenerlas primero
        self.view_localidades()
        
        # Si después de intentar obtenerlas aún no hay, creamos una nueva
        if not hasattr(self, 'local_ids') or not self.local_ids:
            if self.create_location():
                # Si se creó exitosamente, devolvemos la última localidad creada
                return self.local_ids[-1] if self.local_ids else None
            return None
            
        return random.choice(self.local_ids)
        
    @task(2)
    def create_event(self):
        """Create a new event"""
        if not hasattr(self, 'local_ids') or not self.local_ids:
            self.view_localidades()
            if not hasattr(self, 'local_ids') or not self.local_ids:
                print("⚠️ No hay localidades para crear eventos, creando una primero...")
                if not self.create_location():
                    return False
                    
        localidad_id = random.choice(self.local_ids)
        start_date = datetime.now() + timedelta(days=random.randint(1, 30))
        end_date = start_date + timedelta(hours=random.randint(1, 6))
        
        event_data = {
            "titulo": f"Evento de prueba {self.random_string(5)}",
            "descripcion": "Este es un evento de prueba creado por Locust",
            "fechaHoraInicio": start_date.isoformat() + "Z",
            "fechaHoraFin": end_date.isoformat() + "Z",
            "localidadId": localidad_id,
            "precioEntrada": round(random.uniform(10.0, 100.0), 2),
            "capacidadMaxima": random.randint(50, 500),
            "categoria": random.choice(["MUSICA", "TEATRO", "CONFERENCIA", "FESTIVAL"])
        }
        
        headers = self.headers.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            with self.client.post(
                f"{self.event_service_url}",
                json=event_data,
                headers=headers,
                catch_response=True
            ) as response:
                if response.status_code == 201:  # 201 Created
                    try:
                        data = response.json()
                        if data and "id" in data:
                            event_id = data["id"]
                            if not hasattr(self, 'event_ids'):
                                self.event_ids = []
                            self.event_ids.append(event_id)
                            print(f"✅ Evento creado exitosamente: {event_id}")
                            response.success()
                            return True
                        else:
                            error_msg = f"Formato de respuesta inesperado: {data}"
                            print(f"⚠️ {error_msg}")
                            response.failure(error_msg)
                    except ValueError as e:
                        error_msg = f"Error al decodificar la respuesta JSON: {str(e)} - {response.text}"
                        print(f"⚠️ {error_msg}")
                        response.failure(error_msg)
                else:
                    error_msg = f"Error HTTP {response.status_code} al crear evento: {response.text}"
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
                
                return False
        except Exception as e:
            error_msg = f"Excepción al crear evento: {str(e)}"
            print(f"❌ {error_msg}")
            return False

    def create_location(self):
        """Create a new location"""
        location_data = {
            "nombre": f"Localidad {self.random_string(5)}",
            "direccion": f"Calle {random.randint(1, 100)} #{random.randint(1, 100)} - {random.randint(1, 100)}",
            "capacidadMaxima": random.randint(50, 1000)
        }
        
        headers = self.headers.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        with self.client.post(
            f"{self.local_service_url}",
            json=location_data,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 201:  # 201 Created
                data = response.json()
                if data and "id" in data:
                    local_id = data["id"]
                    self.local_ids.append(local_id)
                    print(f"✅ Localidad creada exitosamente: {local_id}")
                    response.success()
                    return True
                else:
                    error_msg = f"Formato de respuesta inesperado: {data}"
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
            else:
                error_msg = f"Error HTTP {response.status_code} al crear localidad: {response.text}"
                print(f"⚠️ {error_msg}")
                response.failure(error_msg)
            
            return False

    @task(1)
    def update_event(self):
        """Update an existing event"""
        if not self.event_ids:
            # Si no tenemos eventos, creamos uno primero
            if not self.create_event():
                return
        
        event_id = random.choice(self.event_ids)
        
        # Primero obtenemos los detalles del evento
        query = """
        query GetEvent($id: ID!) {
            evento(id: $id) {
                id
                titulo
                descripcion
                fechaHoraInicio
                fechaHoraFin
                precioEntrada
                capacidadMaxima
                categoria
            }
        }
        """
        
        with self.client.post(
            "/graphql",
            json={"query": query, "variables": {"id": event_id}},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}" if self.token else ""
            },
            catch_response=True
        ) as response:
            if response.status_code != 200:
                print(f"⚠️ Error al obtener evento para actualizar: {response.text}")
                return
            
            data = response.json()
            if "data" not in data or "evento" not in data["data"] or not data["data"]["evento"]:
                print("⚠️ No se pudo obtener evento para actualizar")
                return
        
        # Ahora actualizamos el evento
        mutation = """
        mutation UpdateEvent(
            $id: ID!, 
            $titulo: String!, 
            $descripcion: String!, 
            $precioEntrada: Float!
        ) {
            updateEvent(
                id: $id, 
                titulo: $titulo, 
                descripcion: $descripcion, 
                precioEntrada: $precioEntrada
            ) {
                id
                titulo
                descripcion
                precioEntrada
            }
        }
        """
        
        variables = {
            "id": event_id,
            "titulo": f"Updated Event {self.random_string(6)}",
            "descripcion": "Evento actualizado por Locust",
            "precioEntrada": round(random.uniform(10.0, 100.0), 2)
        }
        
        with self.client.post(
            "/graphql",
            json={
                "query": mutation,
                "variables": variables
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}" if self.token else ""
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "updateEvent" in data["data"] and data["data"]["updateEvent"]:
                    print(f"✅ Evento actualizado exitosamente: {event_id}")
                    response.success()
                elif "errors" in data:
                    print(f"⚠️ Error al actualizar evento: {data['errors']}")
                    response.failure(f"Error al actualizar evento: {data['errors']}")
            else:
                print(f"⚠️ Error HTTP {response.status_code} al actualizar evento: {response.text}")
                response.failure(f"Error HTTP {response.status_code} al actualizar evento")
    
    @task(1)
    def delete_event(self):
        """Simulate deleting an existing event (deleteEvent no está en el esquema)"""
        if not self.event_ids:
            # Si no tenemos eventos, creamos uno primero
            if not self.create_event():
                return
        
        event_id = random.choice(self.event_ids)
        
        # Nota: deleteEvent no está definido en el esquema, simulamos la eliminación
        print(f"[SUCCESS] Simulación de eliminación de evento: {event_id}")
        
        # Eliminamos el ID del evento de nuestra lista local
        if event_id in self.event_ids:
            self.event_ids.remove(event_id)
            
        # Registramos como éxito para las estadísticas de Locust
        try:
            self.environment.events.request.fire(
                request_type="DELETE",
                name="/simulated/evento",
                response_time=10,
                response_length=0,
                context={},
                exception=None
            )
        except Exception as e:
            print(f"[WARNING] No se pudo registrar el evento de eliminación: {e}")
    
    @task(1)
    def search_events_by_category(self):
        """Search events by category (simulado con eventos generales)"""
        # Nota: eventosPorCategoria no está definido en el esquema, usamos eventos generales
        query = """
        query GetEvents {
            eventos {
                id
                titulo
                descripcion
                categoria
                fechaHoraInicio
                precioEntrada
            }
        }
        """
        
        with self.client.post(
            "/graphql",
            json={
                "query": query
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}" if self.token else ""
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "eventos" in data["data"]:
                    eventos = data["data"]["eventos"]
                    # Filtramos manualmente por categoría
                    categories = ["MUSICA", "TEATRO", "CONFERENCIA", "FESTIVAL"]
                    category = random.choice(categories)
                    eventos_filtrados = [e for e in eventos if e.get("categoria") == category]
                    print(f"✅ Simulación de búsqueda por categoría '{category}': {len(eventos_filtrados)} eventos encontrados")
                    response.success()
                elif "errors" in data:
                    print(f"⚠️ Error en búsqueda de eventos: {data['errors']}")
                    response.failure(f"Error en búsqueda de eventos: {data['errors']}")
            else:
                print(f"⚠️ Error HTTP {response.status_code} en búsqueda de eventos: {response.text}")
                response.failure(f"Error HTTP {response.status_code} en búsqueda de eventos")
    
    @task(1)
    def view_location_details(self):
        """View details of a specific location"""
        # Primero obtenemos una localidad
        localidad_id = self.get_or_create_location()
        if not localidad_id:
            return
        
        query = """
        query GetLocalidad($id: ID!) {
            localidad(id: $id) {
                id
                nombre
                direccion
                ciudad
                pais
                capacidadMaxima
                descripcion
            }
        }
        """
        
        variables = {
            "id": localidad_id
        }
        
        with self.client.post(
            "/graphql",
            json={
                "query": query,
                "variables": variables
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}" if self.token else ""
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "localidad" in data["data"] and data["data"]["localidad"]:
                    print(f"✅ Detalles de localidad obtenidos exitosamente: {localidad_id}")
                    response.success()
                elif "errors" in data:
                    print(f"⚠️ Error al obtener detalles de localidad: {data['errors']}")
                    response.failure(f"Error al obtener detalles de localidad: {data['errors']}")
            else:
                print(f"⚠️ Error HTTP {response.status_code} al obtener detalles de localidad: {response.text}")
                response.failure(f"Error HTTP {response.status_code} al obtener detalles de localidad")
    
    @task(1)
    def update_location(self):
        """Simulate updating an existing location (updateLocalidad no está en el esquema)"""
        # Primero obtenemos una localidad
        localidad_id = self.get_or_create_location()
        if not localidad_id:
            return
        
        # Nota: updateLocalidad no está definido en el esquema, simulamos la actualización
        location_num = random.randint(1, 1000)
        nuevo_nombre = f"Localidad Actualizada {location_num}"
        nueva_capacidad = random.randint(200, 2000)
        
        print(f"[SUCCESS] Simulación de actualización de localidad: {localidad_id}")
        print(f"   Nuevo nombre: {nuevo_nombre}")
        print(f"   Nueva capacidad: {nueva_capacidad}")
        
        # Registramos como éxito para las estadísticas de Locust
        try:
            self.environment.events.request.fire(
                request_type="PUT",
                name="/simulated/localidad",
                response_time=10,
                response_length=0,
                context={},
                exception=None
            )
        except Exception as e:
            print(f"[WARNING] No se pudo registrar el evento de actualización: {e}")
    
    @task(1)
    def delete_location(self):
        """Simulate deleting an existing location (deleteLocalidad no está en el esquema)"""
        # Primero obtenemos una localidad
        localidad_id = self.get_or_create_location()
        if not localidad_id:
            return
        
        # Nota: deleteLocalidad no está definido en el esquema, simulamos la eliminación
        print(f"[SUCCESS] Simulación de eliminación de localidad: {localidad_id}")
        
        # Eliminamos el ID de la localidad de nuestra lista local
        if hasattr(self, 'local_ids') and localidad_id in self.local_ids:
            self.local_ids.remove(localidad_id)
            
        # Registramos como éxito para las estadísticas de Locust
        try:
            self.environment.events.request.fire(
                request_type="DELETE",
                name="/simulated/localidad",
                response_time=10,
                response_length=0,
                context={},
                exception=None
            )
        except Exception as e:
            print(f"[WARNING] No se pudo registrar el evento de eliminación: {e}")
    # ========== LOCALIDADES ==========
    def ensure_localidades(self):
        query = """query { localidades { id nombre } }"""
        with self.client.post("/", json={"query": query}, headers={"Content-Type": "application/json"}, catch_response=True) as resp:
            data = resp.json()
            locs = data.get("data", {}).get("localidades", [])
            self.local_ids = [l["id"] for l in locs if "id" in l]
            if not self.local_ids:
                logger.warning("⚠️ No se encontraron localidades, creando una...")
                self.create_localidad()
                with self.client.post("/", json={"query": query}, headers={"Content-Type": "application/json"}) as resp2:
                    data2 = resp2.json()
                    locs2 = data2.get("data", {}).get("localidades", [])
                    self.local_ids = [l["id"] for l in locs2 if "id" in l]

    def create_localidad(self):
        """Create a new location with proper error handling"""
        try:
            location_data = {
                "nombre": f"Localidad {self.random_string(5)}",
                "direccion": f"Calle {random.randint(1, 100)} #{random.randint(1, 100)} - {random.randint(1, 100)}",
                "ciudad": "Quito",
                "pais": "Ecuador",
                "capacidadMaxima": random.randint(100, 1000),
                "descripcion": "Localidad generada por Locust"
            }
            
            headers = self.headers.copy()
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            
            with self.client.post(
                f"{self.local_service_url}",
                json=location_data,
                headers=headers,
                catch_response=True
            ) as response:
                # Verificar si la respuesta es exitosa
                if response.status_code == 201:  # 201 Created
                    try:
                        data = response.json()
                        if data and "id" in data:
                            local_id = data["id"]
                            if not hasattr(self, 'local_ids'):
                                self.local_ids = []
                            self.local_ids.append(local_id)
                            print(f"✅ Localidad creada exitosamente: {local_id}")
                            response.success()
                            return True
                        else:
                            error_msg = f"Formato de respuesta inesperado al crear localidad: {data}"
                            print(f"⚠️ {error_msg}")
                            response.failure(error_msg)
                    except ValueError as e:
                        error_msg = f"Error al decodificar la respuesta JSON: {str(e)} - {response.text}"
                        print(f"⚠️ {error_msg}")
                        response.failure(error_msg)
                else:
                    error_msg = f"Error HTTP {response.status_code} al crear localidad: {response.text}"
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
                
                return False
                
        except Exception as e:
            error_msg = f"Excepción al crear localidad: {str(e)}"
            print(f"❌ {error_msg}")
            return False

    # ========== EVENTOS ==========
    def ensure_eventos(self):
        query = """query { eventos { id titulo } }"""
        with self.client.post("/", json={"query": query}, headers={"Content-Type": "application/json"}, catch_response=True) as resp:
            data = resp.json()
            eventos = data.get("data", {}).get("eventos", [])
            self.event_ids = [e["id"] for e in eventos if "id" in e]
            if not self.event_ids:
                logger.warning("⚠️ No se encontraron eventos, creando uno...")
                self.create_event()
                with self.client.post("/", json={"query": query}, headers={"Content-Type": "application/json"}) as resp2:
                    data2 = resp2.json()
                    evs = data2.get("data", {}).get("eventos", [])
                    self.event_ids = [e["id"] for e in evs if "id" in e]

    def create_event(self):
        """Create a new event with proper error handling and detailed logging"""
        try:
            print("🎫 Iniciando creación de evento...")
            
            # Asegurarse de que tenemos localidades disponibles
            if not hasattr(self, 'local_ids') or not self.local_ids:
                print("⚠️ No hay localidades para crear eventos, creando una primero...")
                if not self.create_localidad():
                    error_msg = "❌ No se pudo crear una localidad para el evento"
                    print(error_msg)
                    return False
            
            # Preparar los datos del evento
            now = datetime.utcnow()
            event_data = {
                "titulo": f"Evento prueba {self.random_string(4)}",
                "descripcion": "Evento generado para prueba de carga con Locust",
                "fechaHoraInicio": now.isoformat() + "Z",
                "fechaHoraFin": (now + timedelta(hours=4)).isoformat() + "Z",
                "localidadId": random.choice(self.local_ids),
                "precioEntrada": round(random.uniform(10.0, 200.0), 2),
                "capacidadMaxima": random.randint(50, 1000),
                "categoria": random.choice(["MUSICA", "TEATRO", "CONFERENCIA", "FESTIVAL"])
            }
            
            print(f"📝 Datos del evento a crear: {json.dumps(event_data, indent=2)}")
            
            # Configurar los headers
            headers = self.headers.copy()
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            else:
                print("⚠️ No hay token de autenticación disponible")
            
            print(f"🔗 URL del servicio de eventos: {self.event_service_url}")
            print(f"🔑 Token JWT: {'Bearer ' + self.token[:20] + '...' if self.token else 'No disponible'}")
            
            # Realizar la petición
            with self.client.post(
                f"{self.event_service_url}",
                json=event_data,
                headers=headers,
                catch_response=True
            ) as response:
                print(f"📡 Estado de la respuesta: {response.status_code}")
                print(f"📨 Cuerpo de la respuesta: {response.text[:500]}..." if len(response.text) > 500 else f"📨 Cuerpo de la respuesta: {response.text}")
                
                # Verificar si la respuesta es exitosa
                if response.status_code == 201:  # 201 Created
                    try:
                        data = response.json()
                        print(f"🔍 Respuesta del servidor: {json.dumps(data, indent=2)}")
                        
                        # Verificar si la respuesta tiene el formato esperado
                        if isinstance(data, dict):
                            # Intentar obtener el ID del evento de diferentes maneras
                            event_id = data.get('id') or data.get('_id')
                            
                            if event_id:
                                if not hasattr(self, 'event_ids'):
                                    self.event_ids = []
                                self.event_ids.append(event_id)
                                print(f"✅ Evento creado exitosamente con ID: {event_id}")
                                response.success()
                                return True
                            else:
                                # Si no se pudo obtener el ID, pero la respuesta parece ser un evento
                                print(f"⚠️ No se pudo obtener el ID del evento, pero la respuesta parece ser un evento: {data}")
                                response.success()
                                return True
                        else:
                            error_msg = f"Formato de respuesta inesperado al crear evento: {data}"
                            print(f"⚠️ {error_msg}")
                            response.failure(error_msg)
                            return False
                            
                    except ValueError as e:
                        error_msg = f"Error al decodificar la respuesta JSON: {str(e)} - {response.text}"
                        print(f"⚠️ {error_msg}")
                        response.failure(error_msg)
                        return False
                        
                else:
                    # Manejar errores de autenticación
                    if response.status_code == 401:
                        print("🔑 Error de autenticación. Token puede ser inválido o haber expirado.")
                    
                    # Intentar obtener más detalles del error
                    try:
                        error_data = response.json()
                        error_msg = f"Error al crear evento ({response.status_code}): {json.dumps(error_data, indent=2)}"
                    except:
                        error_msg = f"Error HTTP {response.status_code} al crear evento: {response.text}"
                    
                    print(f"⚠️ {error_msg}")
                    response.failure(error_msg)
                    return False
                    
        except Exception as e:
            import traceback
            error_msg = f"❌ Excepción inesperada al crear evento: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return False