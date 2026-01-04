# Configuración de Filecoin (Redundancia)

Tu código ahora soporta dos métodos para conectar con Filecoin y asegurar la redundancia de datos. No es obligatorio usar ambos, elige uno.

## Opción A: Lighthouse (Recomendada y Moderna)
Lighthouse permite almacenamiento perpetuo en Filecoin con un pago único (o nivel gratuito generoso).

1. Ve a [lighthouse.storage](https://lighthouse.storage/) y regístrate.
2. Crea una **API Key**.
3. En **Koyeb > Settings > Environment Variables**:
   - Agrega `LIGHTHOUSE_API_KEY` con tu clave.

## Opción B: Web3.Storage (Legacy)
Si ya tienes una cuenta antigua en web3.storage.

1. Consigue tu token API.
2. En **Koyeb > Settings > Environment Variables**:
   - Agrega `WEB3_STORAGE_TOKEN` con tu token.

## ¿Qué hace esto?
Cada vez que emitas una credencial, el sistema:
1. La subirá a **IPFS** (vía Pinata) para acceso rápido.
2. Automáticamente hará una copia en **Filecoin** (vía Lighthouse o Web3.Storage) para garantizar que nunca se pierda, incluso si Pinata falla.

> **Nota:** El código ya está actualizado (`server/src/services/ipfsService.js`) para detectar automáticamente cuál de las dos variables configuraste y usarla.
