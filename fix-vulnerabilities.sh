#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Actualizando dependencias vulnerables..."

# Dependencias críticas/altas
npm install elliptic@latest || true
npm install pdfjs-dist@latest || true
npm install xlsx@latest || true
npm install jspdf@latest || true

# Dependencias del servidor
pushd server >/dev/null
npm install multer@latest axios@latest || true
popd >/dev/null

# Dependencias de desarrollo
npm install semver@latest path-to-regexp@latest --save-dev || true

# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install

echo "✅ Actualización completada"
npm audit || true
