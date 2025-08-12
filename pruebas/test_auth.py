import requests
import random
import json

# Configuración
BASE_URL = 'http://localhost:3001/api/usuarios'

# Generar email aleatorio para evitar conflictos
email = f'test_{random.randint(1000, 9999)}@example.com'
password = 'Test123!'

print(f'\n1. Registrando usuario con email: {email}')

# Datos para registro
register_data = {
    'nombre': 'Test User',
    'email': email,
    'password': password,
    'confirmarPassword': password
}

try:
    # Intentar registrar usuario
    reg_response = requests.post(f'{BASE_URL}/registro', json=register_data)
    print(f'Registro status: {reg_response.status_code}')
    print(f'Registro response: {json.dumps(reg_response.json(), indent=2)}')
    
    # Si el registro fue exitoso, intentar login
    if reg_response.status_code in [200, 201]:
        print(f'\n2. Intentando login con email: {email}')
        
        login_data = {
            'email': email,
            'password': password
        }
        
        login_response = requests.post(f'{BASE_URL}/login', json=login_data)
        print(f'Login status: {login_response.status_code}')
        print(f'Login response: {json.dumps(login_response.json(), indent=2)}')
        
        # Si el login fue exitoso, mostrar el token
        if login_response.status_code == 200 and 'token' in login_response.json():
            print(f'\n✅ Login exitoso! Token recibido.')
    else:
        print(f'\n❌ Registro fallido. No se intentará login.')
        
    # Probar login con GraphQL
    print(f'\n3. Intentando login con GraphQL')
    graphql_url = 'http://localhost:4000/graphql'
    
    # Mutation para loginUser
    login_mutation = """
    mutation LoginUser($email: String!, $password: String!) {
        loginUser(email: $email, password: $password) {
            token
            usuario {
                id
                nombre
                email
            }
        }
    }
    """
    
    graphql_payload = {
        'query': login_mutation,
        'variables': {
            'email': email,
            'password': password
        }
    }
    
    graphql_response = requests.post(graphql_url, json=graphql_payload)
    print(f'GraphQL login status: {graphql_response.status_code}')
    print(f'GraphQL login response: {json.dumps(graphql_response.json(), indent=2)}')
    
    # Probar login alternativo con GraphQL
    print(f'\n4. Intentando login alternativo con GraphQL')
    
    # Mutation para login
    alt_login_mutation = """
    mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
            token
            usuario {
                id
                nombre
                email
            }
        }
    }
    """
    
    alt_graphql_payload = {
        'query': alt_login_mutation,
        'variables': {
            'email': email,
            'password': password
        }
    }
    
    alt_graphql_response = requests.post(graphql_url, json=alt_graphql_payload)
    print(f'GraphQL alt login status: {alt_graphql_response.status_code}')
    print(f'GraphQL alt login response: {json.dumps(alt_graphql_response.json(), indent=2)}')
    
except Exception as e:
    print(f'\n❌ Error: {str(e)}')