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
        # Handle if file wraps it in 'data' or just raw workflow
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
         # Simplified activation via POST to /activate usually works or PUT
         # Standard API: POST /workflows/:id/activate
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
        res = requests.post(args.url, json=data) # Webhooks usually don't need auth headers unless configured
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

    # list
    p_list = subparsers.add_parser('list')
    p_list.set_defaults(func=list_workflows)

    # get
    p_get = subparsers.add_parser('get')
    p_get.add_argument('id', help='Workflow ID')
    p_get.set_defaults(func=get_workflow)

    # create
    p_create = subparsers.add_parser('create')
    p_create.add_argument('file', help='JSON file path')
    p_create.set_defaults(func=create_workflow)

    # update
    p_update = subparsers.add_parser('update')
    p_update.add_argument('id', help='Workflow ID')
    p_update.add_argument('file', help='JSON file path')
    p_update.set_defaults(func=update_workflow)

    # activate
    p_act = subparsers.add_parser('activate')
    p_act.add_argument('id', help='Workflow ID')
    p_act.set_defaults(func=lambda args: set_activation(args, True))

    # deactivate
    p_deact = subparsers.add_parser('deactivate')
    p_deact.add_argument('id', help='Workflow ID')
    p_deact.set_defaults(func=lambda args: set_activation(args, False))

    # run_webhook
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
