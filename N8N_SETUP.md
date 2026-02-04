### antigravity_mcp_config.json
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://n8n-b0be.onrender.com/mcp-server/http",
        "--header",
        "authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjZlZTdkZDgzLTliNzctNGFhNS1iY2VjLWE2MTA5NjAyMDc0MiIsImlhdCI6MTc3MDIyNTY4OX0.48YAHMU33MKeHdRfHvOtnQgHAX7ougugZ-v_K6LyE7Q"
      ]
    }
  }
}
```

### n8n_mcp_server_workflow.json
```json
{
  "name": "MCP Server - Antigravity Integration",
  "nodes": [
    {
      "parameters": {},
      "type": "@n8n/n8n-nodes-langchain.mcpServerTrigger",
      "typeVersion": 1,
      "position": [0, 0],
      "id": "trigger-node",
      "name": "MCP Server"
    },
    {
      "parameters": {
        "name": "list_workflows",
        "description": "List all workflows in the n8n instance",
        "method": "GET",
        "url": "https://n8n-b0be.onrender.com/api/v1/workflows",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [200, -200],
      "id": "tool-list",
      "name": "list_workflows"
    },
    {
      "parameters": {
        "name": "get_workflow",
        "description": "Get details and JSON of a specific workflow by ID",
        "method": "GET",
        "url": "={{ 'https://n8n-b0be.onrender.com/api/v1/workflows/' + $fromAI('id', 'The ID of the workflow to retrieve') }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [200, 0],
      "id": "tool-get",
      "name": "get_workflow"
    },
    {
      "parameters": {
        "name": "create_workflow",
        "description": "Create a new workflow from a JSON definition",
        "method": "POST",
        "url": "https://n8n-b0be.onrender.com/api/v1/workflows",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "name",
              "value": "={{ $fromAI('name', 'Name of the workflow') }}"
            },
            {
              "name": "nodes",
              "value": "={{ JSON.parse($fromAI('nodes_json', 'JSON string of the nodes array')) }}"
            },
            {
              "name": "connections",
              "value": "={{ JSON.parse($fromAI('connections_json', 'JSON string of the connections object')) }}"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [200, 200],
      "id": "tool-create",
      "name": "create_workflow"
    },
    {
      "parameters": {
        "name": "update_workflow",
        "description": "Update an existing workflow by ID with new JSON definition",
        "method": "PUT",
        "url": "={{ 'https://n8n-b0be.onrender.com/api/v1/workflows/' + $fromAI('id', 'The ID of the workflow to update') }}",
        "sendBody": true,
        "bodyParameters": {
            "parameters": [
             {
              "name": "name",
              "value": "={{ $fromAI('name', 'New name of the workflow') }}"
             }
            ]
        },
         "specifyBody": "json",
         "jsonBody": "={{ JSON.parse($fromAI('workflow_json_full', 'The full valid workflow JSON object containing nodes and connections')) }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [200, 400],
      "id": "tool-update",
      "name": "update_workflow"
    },
    {
      "parameters": {
        "name": "activate_workflow",
        "description": "Activate a workflow by ID",
        "method": "POST",
        "url": "={{ 'https://n8n-b0be.onrender.com/api/v1/workflows/' + $fromAI('id', 'The ID of the workflow') + '/activate' }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [450, -200],
      "id": "tool-activate",
      "name": "activate_workflow"
    },
     {
      "parameters": {
        "name": "deactivate_workflow",
        "description": "Deactivate a workflow by ID",
        "method": "POST",
        "url": "={{ 'https://n8n-b0be.onrender.com/api/v1/workflows/' + $fromAI('id', 'The ID of the workflow') + '/deactivate' }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-N8N-API-KEY",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTQxMzQyOC02NTQyLTQ2YmItOTVhMi1jYzAzMzVkNTg5MmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTZmYzZmNzgtNmU0YS00ZTI5LWE1ZDItYTY0MGYyZTAzNDk0IiwiaWF0IjoxNzcwMjI1ODk3fQ.K9kRoCgNNgsJrzei0ob01nexBztKRA5-S0r5-iYYl68"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [450, 0],
      "id": "tool-deactivate",
      "name": "deactivate_workflow"
    },
    {
      "parameters": {
        "name": "execute_workflow",
        "description": "Execute a workflow via Webhook URL/ID",
        "method": "POST",
        "url": "={{ $fromAI('webhook_url', 'Full Webhook URL') }}",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.parse($fromAI('payload_json', 'JSON payload to send')) }}", 
        "sendHeaders": false
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1,
      "position": [450, 200],
      "id": "tool-execute",
      "name": "execute_workflow"
    },
    {
        "parameters": {
            "name": "audit_workflow",
            "description": "Audit a workflow JSON for best practices and return analysis",
            "jsCode": "const workflow = JSON.parse(query);\nconst risks = [];\nconst improvements = [];\nconst nodes = workflow.nodes || [];\nif (nodes.length === 0) risks.push('Workflow is empty');\nif (nodes.length > 30) risks.push('Workflow is too large (>30 nodes). Consider splitting.');\n// Check for disconnected nodes\nconst connectedNodes = new Set();\nif (workflow.connections) {\n  Object.values(workflow.connections).forEach(c => {\n     c.main.forEach(arr => arr.forEach(link => connectedNodes.add(link.node)));\n  });\n}\nif (nodes.length > 0 && connectedNodes.size < nodes.length - 1) improvements.push('Some nodes appear disconnected.');\n\nreturn JSON.stringify({ risks, improvements, score: 80, notes: 'Simple audit performed.' });"
        },
        "type": "@n8n/n8n-nodes-langchain.toolCode",
        "typeVersion": 1,
        "position": [450, 400],
        "id": "tool-audit",
        "name": "audit_workflow"
    },
    {
        "parameters": {
            "name": "auto_document_workflow",
            "description": "Add documentation sticky note to a workflow JSON",
            "jsCode": "const workflow = JSON.parse(query);\nif (!workflow.nodes) workflow.nodes = [];\nworkflow.nodes.push({\n  \"parameters\": {\n    \"content\": \"## Auto-Documentation\\n\\nVerified by Antigravity.\",\n    \"height\": 200,\n    \"width\": 300,\n    \"color\": 4\n  },\n  \"type\": \"n8n-nodes-base.stickyNote\",\n  \"typeVersion\": 1,\n  \"position\": [0, -400],\n  \"id\": \"auto-doc-\" + Math.random().toString(36).substring(7),\n  \"name\": \"Documentation\"\n});\nreturn JSON.stringify(workflow);"
        },
        "type": "@n8n/n8n-nodes-langchain.toolCode",
        "typeVersion": 1,
        "position": [650, 400],
        "id": "tool-auto-doc",
        "name": "auto_document_workflow"
    }
  ],
  "connections": {
    "trigger-node": {
      "main": [
        [
          { "node": "tool-list", "type": "main", "index": 0 },
          { "node": "tool-get", "type": "main", "index": 0 },
          { "node": "tool-create", "type": "main", "index": 0 },
          { "node": "tool-update", "type": "main", "index": 0 },
          { "node": "tool-activate", "type": "main", "index": 0 },
          { "node": "tool-deactivate", "type": "main", "index": 0 },
          { "node": "tool-execute", "type": "main", "index": 0 },
          { "node": "tool-audit", "type": "main", "index": 0 },
          { "node": "tool-auto-doc", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

### n8n_manager.py
```python
import os
import sys
import json
import argparse
import requests

def get_env_var(name):
    val = os.environ.get(name)
    if not val:
        print(f"Error: Environment variable {name} not set.")
        sys.exit(1)
    return val

BASE_URL = get_env_var("N8N_BASE_URL").rstrip('/')
API_KEY = get_env_var("N8N_API_KEY")

HEADERS = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

def list_workflows(args):
    try:
        res = requests.get(f"{BASE_URL}/api/v1/workflows", headers=HEADERS)
        res.raise_for_status()
        workflows = res.json().get('data', [])
        print(f"Found {len(workflows)} workflows:")
        for w in workflows:
            state = "Active" if w.get('active') else "Inactive"
            print(f"[{w['id']}] {w['name']} ({state})")
    except Exception as e:
        print(f"Error listing workflows: {e}")

def get_workflow(args):
    try:
        res = requests.get(f"{BASE_URL}/api/v1/workflows/{args.id}", headers=HEADERS)
        res.raise_for_status()
        print(json.dumps(res.json(), indent=2))
    except Exception as e:
        print(f"Error getting workflow: {e}")

def create_workflow(args):
    try:
        with open(args.file, 'r') as f:
            data = json.load(f)
        if 'nodes' not in data and 'data' in data:
            data = data['data']
            
        res = requests.post(f"{BASE_URL}/api/v1/workflows", headers=HEADERS, json=data)
        res.raise_for_status()
        print(f"Workflow created. ID: {res.json()['id']}")
    except Exception as e:
        print(f"Error creating workflow: {e}")

def update_workflow(args):
    try:
        with open(args.file, 'r') as f:
            data = json.load(f)
        
        res = requests.put(f"{BASE_URL}/api/v1/workflows/{args.id}", headers=HEADERS, json=data)
        res.raise_for_status()
        print(f"Workflow {args.id} updated.")
    except Exception as e:
        print(f"Error updating workflow: {e}")

def set_activation(args, active):
    try:
         endpoint = "activate" if active else "deactivate"
         res = requests.post(f"{BASE_URL}/api/v1/workflows/{args.id}/{endpoint}", headers=HEADERS)
         res.raise_for_status()
         status = "activated" if active else "deactivated"
         print(f"Workflow {args.id} {status}.")
    except Exception as e:
        print(f"Error setting activation: {e}")

def run_webhook(args):
    try:
        data = json.loads(args.data) if args.data else {}
        print(f"Calling webhook: {args.url}")
        res = requests.post(args.url, json=data) 
        print(f"Status: {res.status_code}")
        try:
            print(json.dumps(res.json(), indent=2))
        except:
            print(res.text)
    except Exception as e:
        print(f"Error running webhook: {e}")

def main():
    parser = argparse.ArgumentParser(description="n8n Manager CLI")
    subparsers = parser.add_subparsers()

    p_list = subparsers.add_parser('list')
    p_list.set_defaults(func=list_workflows)

    p_get = subparsers.add_parser('get')
    p_get.add_argument('id', help='Workflow ID')
    p_get.set_defaults(func=get_workflow)

    p_create = subparsers.add_parser('create')
    p_create.add_argument('file', help='JSON file path')
    p_create.set_defaults(func=create_workflow)

    p_update = subparsers.add_parser('update')
    p_update.add_argument('id', help='Workflow ID')
    p_update.add_argument('file', help='JSON file path')
    p_update.set_defaults(func=update_workflow)

    p_act = subparsers.add_parser('activate')
    p_act.add_argument('id', help='Workflow ID')
    p_act.set_defaults(func=lambda args: set_activation(args, True))

    p_deact = subparsers.add_parser('deactivate')
    p_deact.add_argument('id', help='Workflow ID')
    p_deact.set_defaults(func=lambda args: set_activation(args, False))

    p_run = subparsers.add_parser('run_webhook')
    p_run.add_argument('url', help='Webhook URL')
    p_run.add_argument('--data', help='JSON string data', default='{}')
    p_run.set_defaults(func=run_webhook)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

### Pasos de instalación (máx 12 pasos)
1.  **Copiar el JSON**: Toma el contenido de `n8n_mcp_server_workflow.json` anterior.
2.  **Importar Workflow**: En tu n8n UI, ve a "Add Workflow" > botón de menú import > Import from JSON/Code y pega el contenido.
3.  **Guardar y Activar**: Pulsa "Save". **IMPORTANTE**: Activa el workflow (Toggle "Active").
4.  **Verificar MCP Server Node**: Asegúrate de que el nodo "MCP Server" no muestra errores y está conectado a todas las tools.
5.  **Instalar n8n_manager**: Guarda `n8n_manager.py` en tu entorno local.
6.  **Instalar dependencias Python**: Ejecuta `pip install requests argparse`.
7.  **Configurar ENV**: Establece las variables de entorno para el script:
    `export N8N_BASE_URL="https://n8n-b0be.onrender.com"`
    `export N8N_API_KEY="<TU_CLAVE_API_O_JWT>"` (usa la que proporcionaste).
8.  **Probar Conexión**: Ejecuta `python3 n8n_manager.py list`. Deberías ver tu workflow MCP listado.
9.  **Configurar Antigravity**: Añade el contenido de `antigravity_mcp_config.json` a tu configuración de MCP en Antigravity.
10. **Reiniciar Antigravity**: Reinicia (o recarga) la conexión MCP para que detecte el servidor `n8n-mcp`.
11. **Validar Tools**: En Antigravity, pregunta "¿Qué workflows tengo en n8n?" para verificar que `list_workflows` funciona.
12. **¡Listo!**: Ahora puedes gestionar n8n desde aquí.

### Checklist de validación (máx 10 checks)
1.  [ ] `python3 n8n_manager.py list` devuelve lista sin errores.
2.  [ ] Workflow "MCP Server - Antigravity Integration" está **Activo** en n8n UI.
3.  [ ] El nodo "MCP Server" tiene nodos Tool conectados visibles.
4.  [ ] La URL `https://n8n-b0be.onrender.com/mcp-server/http` responde (puedes probar con curl).
5.  [ ] `N8N_API_KEY` funciona (si falla 401, verifica si es Bearer vs X-N8N-API-KEY).
6.  [ ] En Antigravity, la tool `list_workflows` aparece disponible.
7.  [ ] `execute_workflow` tiene la URL de webhook correcta si la usas.
8.  [ ] `audit_workflow` devuelve un JSON con "risks/improvements".
9.  [ ] El paquete `@n8n/n8n-nodes-langchain` está disponible en la instancia n8n (o los nodos aparecen correctamente).
10. [ ] Las llamadas a la API Pública viajan correctamente (status 200).

### Prompts de prueba en Antigravity (6 prompts)
1.  "Lista todos los workflows activos en mi instancia de n8n."
2.  "Obtén el detalle del workflow con ID `<ID_DEL_WORKFLOW>` y audítalo."
3.  "Crea un nuevo workflow simple que tenga un Webhook Trigger y un nodo de Debug. Llámalo 'Test Antigravity'."
4.  "Actualiza el workflow 'Test Antigravity' para añadir una nota de documentación automática."
5.  "Ejecuta el workflow 'Test Antigravity' simulando un webhook con payload `{\"test\": true}`."
6.  "Desactiva el workflow 'Test Antigravity'."
