#!/usr/bin/env python3
"""
create_ritm.py — Create a ServiceNow RITM via the Service Catalog API.
 
Usage:
    python create_ritm.py --config config.json --values values.json
"""
 
import argparse
import json
import sys
import requests
 
 
def get_access_token(instance, client_id, client_secret, username=None, password=None,
                     grant_type="password"):
    """Obtain an OAuth 2.0 access token (password or client_credentials grant)."""
    url = f"https://{instance}.service-now.com/oauth_token.do"
    data = {
        "grant_type": grant_type,
        "client_id": client_id,
        "client_secret": client_secret,
    }
    if grant_type == "password":
        data["username"] = username
        data["password"] = password
 
    resp = requests.post(url, data=data)
    resp.raise_for_status()
    return resp.json()["access_token"]
 
 
def get_catalog_variables(instance, token, catalog_item_sys_id):
    """Fetch the variable definitions (name/type/label) for a catalog item template."""
    url = f"https://{instance}.service-now.com/api/sn_sc/servicecatalog/items/{catalog_item_sys_id}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
 
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    variables = resp.json().get("result", {}).get("variables", [])
    return {v["name"]: v.get("type") for v in variables}
 
 
def create_ritm(instance, token, catalog_item_sys_id, variable_values, quantity="1"):
    """Order the catalog item, creating a REQ + RITM."""
    url = f"https://{instance}.service-now.com/api/sn_sc/servicecatalog/items/{catalog_item_sys_id}/order_now"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"sysparm_quantity": quantity, "variables": variable_values}
 
    resp = requests.post(url, headers=headers, data=json.dumps(payload))
    resp.raise_for_status()
    return resp.json()["result"]
 
 
def main():
    parser = argparse.ArgumentParser(description="Create a ServiceNow RITM")
    parser.add_argument("--config", required=True, help="JSON file with instance/auth/catalog_item_sys_id")
    parser.add_argument("--values", required=True, help="JSON file with variable name/value pairs")
    parser.add_argument("--validate-only", action="store_true",
                         help="Only fetch and print expected variable names, do not create the RITM")
    args = parser.parse_args()
 
    with open(args.config) as f:
        cfg = json.load(f)
    with open(args.values) as f:
        variable_values = json.load(f)
 
    try:
        token = get_access_token(
            instance=cfg["instance"],
            client_id=cfg["client_id"],
            client_secret=cfg["client_secret"],
            username=cfg.get("username"),
            password=cfg.get("password"),
            grant_type=cfg.get("grant_type", "password"),
        )
 
        expected_vars = get_catalog_variables(cfg["instance"], token, cfg["catalog_item_sys_id"])
 
        if args.validate_only:
            print("Expected variables for this catalog item:")
            for name, vtype in expected_vars.items():
                print(f"  - {name} ({vtype})")
            return
 
        unknown = set(variable_values) - set(expected_vars)
        if unknown:
            print(f"Warning: variables not defined on this catalog item: {unknown}", file=sys.stderr)
 
        result = create_ritm(
            instance=cfg["instance"],
            token=token,
            catalog_item_sys_id=cfg["catalog_item_sys_id"],
            variable_values=variable_values,
            quantity=cfg.get("quantity", "1"),
        )
 
        print(f"Request created: {result['request_number']}")
        for item in result.get("items", []):
            print(f"RITM created: {item['number']} (sys_id: {item['sys_id']})")
 
    except requests.exceptions.HTTPError as e:
        print(f"API error: {e.response.status_code} - {e.response.text}", file=sys.stderr)
        sys.exit(1)
 
 
if __name__ == "__main__":
    main()
