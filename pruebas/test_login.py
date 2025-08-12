import requests
import json
import random
import string

# URL base para GraphQL
GRAPHQL_URL = "http://localhost:4000/graphql"

# Función para generar un email aleatorio
def generate_random_email():
    random_string = ''.join(random.choice(string.ascii_lowercase) for _ in range(8))
    return f"{random_string}@test.com"

# Función para registrar un nuevo usuario
def register_user(nombre, email, password):
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
        "nombre": nombre,
        "email": email,
        "password": password,
        "confirmarPassword": password
    }
    
    response = requests.post(
        GRAPHQL_URL,
        json={"query": mutation, "variables": variables},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nRegistro de usuario - Status Code: {response.status_code}")
    print(f"Respuesta: {json.dumps(response.json(), indent=2)}")
    
    return response.json()

# Función para iniciar sesión con un usuario
def login_user(email, password):
    mutation = """
    mutation LoginUser($email: String!, $password: String!) {
        loginUser(email: $email, password: $password) {
            token
            usuario {
                id
                nombre
                email
                rol
            }
            expiraEn
        }
    }
    """
    
    variables = {
        "email": email,
        "password": password
    }
    
    response = requests.post(
        GRAPHQL_URL,
        json={"query": mutation, "variables": variables},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nLogin de usuario - Status Code: {response.status_code}")
    print(f"Respuesta: {json.dumps(response.json(), indent=2)}")
    
    return response.json()

# Función principal
def main():
    # Generar datos de prueba
    nombre = "Usuario de Prueba"
    email = generate_random_email()
    password = "password123"
    
    print(f"\n🧪 Probando registro y login con email: {email}")
    
    # Registrar usuario
    register_result = register_user(nombre, email, password)
    
    # Verificar si el registro fue exitoso
    if "data" in register_result and register_result["data"] and "registerUser" in register_result["data"]:
        print("\n✅ Registro exitoso!")
        
        # Intentar iniciar sesión
        login_result = login_user(email, password)
        
        # Verificar si el login fue exitoso
        if "data" in login_result and login_result["data"] and "loginUser" in login_result["data"]:
            token = login_result["data"]["loginUser"]["token"]
            print(f"\n✅ Login exitoso! Token: {token[:20]}...")
        else:
            print("\n❌ Login fallido!")
            if "errors" in login_result:
                print(f"Errores: {login_result['errors']}")
    else:
        print("\n❌ Registro fallido!")
        if "errors" in register_result:
            print(f"Errores: {register_result['errors']}")

# Ejecutar el script
if __name__ == "__main__":
    main()