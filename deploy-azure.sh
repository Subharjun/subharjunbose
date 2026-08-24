#!/usr/bin/env bash
#
# Deploys this portfolio to Azure Static Web Apps (Free tier).
#
# Prerequisite — run this once, it opens a browser:
#     az login
#
# Then:  ./deploy-azure.sh
#
set -euo pipefail

RG="${RG:-rg-knowsubharjun}"
APP="${APP:-knowsubharjun}"
# Static Web Apps only runs in: westus2, centralus, eastus2, westeurope, eastasia.
# eastasia is the closest to India.
LOC="${LOC:-eastasia}"

echo "==> Checking authentication"
if ! az account get-access-token --resource https://management.azure.com >/dev/null 2>&1; then
  echo "Not authenticated. Run 'az login' first (it needs a browser for MFA)." >&2
  exit 1
fi
az account show --query "{subscription:name, user:user.name}" -o tsv

echo "==> Resource group: $RG ($LOC)"
az group create -n "$RG" -l "$LOC" -o none

echo "==> Static Web App: $APP"
if ! az staticwebapp show -n "$APP" -g "$RG" >/dev/null 2>&1; then
  az staticwebapp create -n "$APP" -g "$RG" -l "$LOC" --sku Free -o none
  echo "    created"
else
  echo "    already exists, reusing"
fi

echo "==> Fetching deployment token"
TOKEN="$(az staticwebapp secrets list -n "$APP" -g "$RG" --query "properties.apiKey" -o tsv)"

echo "==> Staging publish folder"
# The SWA CLI refuses to deploy when the source folder is the current directory,
# and staging also keeps this script and the README screenshots out of the site.
STAGE_ROOT="$(mktemp -d)"
trap 'rm -rf "$STAGE_ROOT"' EXIT
STAGE="$STAGE_ROOT/site"
mkdir -p "$STAGE"
cp index.html staticwebapp.config.json "$STAGE/"
cp -R assets "$STAGE/"
find "$STAGE" -name '.DS_Store' -delete
echo "    $(find "$STAGE" -type f | wc -l | tr -d ' ') files, $(du -sh "$STAGE" | cut -f1)"

echo "==> Uploading site"
( cd "$STAGE_ROOT" && npx -y @azure/static-web-apps-cli deploy ./site \
    --deployment-token "$TOKEN" \
    --env production )

HOST="$(az staticwebapp show -n "$APP" -g "$RG" --query defaultHostname -o tsv)"
echo
echo "==> Live at: https://$HOST"
echo
echo "To attach knowsubharjun.com once you own it:"
echo "  1. At your registrar, add a CNAME:  www -> $HOST"
echo "     and an ALIAS/ANAME for the apex: @ -> $HOST"
echo "  2. az staticwebapp hostname set -n $APP -g $RG --hostname www.knowsubharjun.com"
echo "     az staticwebapp hostname set -n $APP -g $RG --hostname knowsubharjun.com"
echo "  Azure issues and renews the TLS certificate automatically."
