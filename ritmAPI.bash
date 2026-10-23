#!/usr/bin/env bash
# create_ritm.sh — Create a ServiceNow RITM via the Service Catalog API.
# Requires: curl, jq
# Usage: ./create_ritm.sh
 
set -euo pipefail
 
# ---- Configuration (move to env vars / secrets manager in production) ----
INSTANCE="your-instance"
CLIENT_ID="<client_id>"
CLIENT_SECRET="<client_secret>"
SN_USERNAME="<service_account>"
SN_PASSWORD="<service_account_password>"
CATALOG_ITEM_SYS_ID="<catalog_item_sys_id>"
QUANTITY="1"
 
BASE_URL="https://${INSTANCE}.service-now.com"
 
# ---- Step 1: Get OAuth token ----
echo "Requesting access token..." >&2
TOKEN_RESPONSE=$(curl -sS -X POST "${BASE_URL}/oauth_token.do" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&username=${SN_USERNAME}&password=${SN_PASSWORD}")
 
ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r '.access_token')
 
if [[ "${ACCESS_TOKEN}" == "null" || -z "${ACCESS_TOKEN}" ]]; then
  echo "Failed to obtain access token:" >&2
  echo "${TOKEN_RESPONSE}" >&2
  exit 1
fi
 
# ---- Step 2 (optional): Discover expected variable names ----
echo "Fetching catalog item variable definitions..." >&2
curl -sS -X GET "${BASE_URL}/api/sn_sc/servicecatalog/items/${CATALOG_ITEM_SYS_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/json" \
  | jq -r '.result.variables[] | "\(.name) (\(.type))"'
 
# ---- Step 3: Build the payload ----
# In practice, generate this dynamically (e.g. from a values.json) rather than
# hardcoding — shown inline here for clarity.
PAYLOAD=$(jq -n \
  --arg qty "${QUANTITY}" \
  --arg short_description "New laptop request" \
  --arg requested_for "<sys_id_of_user>" \
  --arg assignment_group "<sys_id_of_group>" \
  '{
    sysparm_quantity: $qty,
    variables: {
      short_description: $short_description,
      requested_for: $requested_for,
      assignment_group: $assignment_group
    }
  }')
 
# ---- Step 4: Create the RITM ----
echo "Creating RITM..." >&2
RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST \
  "${BASE_URL}/api/sn_sc/servicecatalog/items/${CATALOG_ITEM_SYS_ID}/order_now" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${PAYLOAD}")
 
HTTP_CODE=$(echo "${RESPONSE}" | tail -n1)
BODY=$(echo "${RESPONSE}" | sed '$d')
 
if [[ "${HTTP_CODE}" != "200" && "${HTTP_CODE}" != "201" ]]; then
  echo "Error creating RITM (HTTP ${HTTP_CODE}):" >&2
  echo "${BODY}" >&2
  exit 1
fi
 
REQ_NUMBER=$(echo "${BODY}" | jq -r '.result.request_number')
echo "Request created: ${REQ_NUMBER}"
echo "${BODY}" | jq -r '.result.items[] | "RITM created: \(.number) (sys_id: \(.sys_id))"'


# No token step needed — auth happens at the TLS layer.
curl -sS -w "\n%{http_code}" -X POST \
  "${BASE_URL}/api/sn_sc/servicecatalog/items/${CATALOG_ITEM_SYS_ID}/order_now" \
  --cert /path/to/client.pem \
  --key /path/to/client-key.pem \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
