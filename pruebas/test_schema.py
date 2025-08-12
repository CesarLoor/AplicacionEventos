import requests
import json

# URL del servidor GraphQL
url = 'http://localhost:4000/graphql'

# Consulta para obtener el esquema
query = '''
{
  __schema {
    types {
      name
      kind
      fields {
        name
      }
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

# Formatear y mostrar solo los tipos Mutation y sus campos
data = response.json()
if 'data' in data and '__schema' in data['data']:
    types = data['data']['__schema']['types']
    for type_info in types:
        if type_info['name'] == 'Mutation':
            print("\nMutation fields:")
            if type_info['fields']:
                for field in type_info['fields']:
                    print(f"  - {field['name']}")
            else:
                print("  No fields found")
            break
else:
    print("Response:")
    print(json.dumps(data, indent=2))