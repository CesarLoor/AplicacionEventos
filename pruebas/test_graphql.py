import requests

# URL del servidor GraphQL
url = 'http://localhost:4000/graphql'

# Consulta GraphQL para login
query = '''
mutation {
    loginUser(email: "test@example.com", password: "Test123!") {
        token
        usuario {
            id
            nombre
            email
        }
    }
}
'''

# Enviar la solicitud
response = requests.post(
    url,
    json={'query': query},
    headers={'Content-Type': 'application/json'}
)

# Imprimir resultados
print(f"Status Code: {response.status_code}")
print("Response:")
print(response.text)