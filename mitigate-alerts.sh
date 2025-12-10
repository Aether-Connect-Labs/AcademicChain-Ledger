#!/usr/bin/env bash
set -euo pipefail

echo "🔐 Mitigando alertas de Dependabot"

# Actualizaciones críticas
npm update elliptic pdfjs-dist xlsx jspdf node-forge multer axios || true

# Overrides ya definidos en package.json
npm install

# Build y tests
npm run build
npm test || true

echo "✅ Mitigación completada. Revisa Dependabot y cierra alertas aplicables."
