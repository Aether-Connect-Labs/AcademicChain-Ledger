
# AcademicChain Ledger

Sistema de certificación académica basado en blockchain (Hedera, XRPL, Algorand).

## Estructura del Proyecto

- `client/`: Frontend (Vite + React).
- `contracts/`: Smart Contracts.
- `n8n/`: Workflows de automatización.
- `package.json`: Configuración raíz para despliegue en Cloudflare Pages.
- `wrangler.jsonc`: Configuración de Cloudflare Pages.

## Despliegue en Cloudflare Pages

Este proyecto está configurado para desplegarse automáticamente en Cloudflare Pages.

### Configuración Importante

Si encuentras el error `Failed: root directory not found`, asegúrate de que la configuración en Cloudflare Dashboard sea:

- **Root directory**: `/` (Déjalo vacío o pon `/`)
- **Build command**: `npm run build`
- **Build output directory**: `client/dist`

El archivo `wrangler.jsonc` en la raíz se encarga de anular la configuración predeterminada para asegurar que el directorio de salida sea correcto (`client/dist`).
