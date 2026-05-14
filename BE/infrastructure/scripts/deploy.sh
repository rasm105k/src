#!/usr/bin/env bash
set -euo pipefail

# ─── config ───────────────────────────────────────────
ENVIRONMENT="${1:-dev}"
LOCATION="westeurope"
RESOURCE_GROUP="rg-docfeeder-${ENVIRONMENT}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../main.bicep"
PARAMETERS="${SCRIPT_DIR}/../parameters.${ENVIRONMENT}.json"

# ─── checks ───────────────────────────────────────────
command -v az >/dev/null 2>&1 || { echo "ERROR: Azure CLI not found. Install it from https://aka.ms/installazurecliwindows"; exit 1; }
[ -f "$TEMPLATE" ] || { echo "ERROR: Template not found at $TEMPLATE"; exit 1; }
[ -f "$PARAMETERS" ] || echo "WARN: No parameters file at $PARAMETERS — using defaults"

# ─── login ────────────────────────────────────────────
echo "🔐 Checking Azure login…"
ACCOUNT=$(az account show --query id -o tsv 2>/dev/null || true)
if [ -z "$ACCOUNT" ]; then
  echo "   Not logged in. Starting browser login…"
  az login --use-device-code
  ACCOUNT=$(az account show --query id -o tsv)
fi
echo "   Subscription: $ACCOUNT"

# ─── register providers ───────────────────────────────
echo -e "\n📦 Registering resource providers…"
for ns in Microsoft.EventGrid Microsoft.Web Microsoft.Storage Microsoft.Logic Microsoft.OperationalInsights Microsoft.Insights Microsoft.KeyVault Microsoft.CognitiveServices; do
  state=$(az provider show --namespace "$ns" --query registrationState -o tsv 2>/dev/null || echo "NotRegistered")
  if [ "$state" != "Registered" ]; then
    echo "   Registering $ns …"
    az provider register --namespace "$ns" --wait
  else
    echo "   $ns ✅"
  fi
done

# ─── resource group ───────────────────────────────────
echo -e "\n📁 Ensuring resource group…"
RG_EXISTS=$(az group exists --name "$RESOURCE_GROUP" -o tsv)
if [ "$RG_EXISTS" == "false" ]; then
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
  echo "   Created $RESOURCE_GROUP"
else
  echo "   $RESOURCE_GROUP ✅"
fi

# ─── deploy ───────────────────────────────────────────
echo -e "\n🚀 Deploying Bicep template…"
DEPLOY_NAME="docfeeder-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"

if [ -f "$PARAMETERS" ]; then
  az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOY_NAME" \
    --template-file "$TEMPLATE" \
    --parameters "$PARAMETERS"
else
  az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOY_NAME" \
    --template-file "$TEMPLATE"
fi

echo -e "\n✅ Deployment complete: $DEPLOY_NAME"
echo "   Resource group: $RESOURCE_GROUP"
