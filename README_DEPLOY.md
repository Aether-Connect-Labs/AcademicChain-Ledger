# Instrucciones de Despliegue - AcademicChain Ledger

## 1. Requisitos Previos
- Node.js instalado.
- Cuenta de Cloudflare activa.

## 2. Despliegue Automático
Ejecuta el script de PowerShell incluido para autenticarte y desplegar:

```powershell
./deploy_worker.ps1
```

## 3. Verificación
Una vez desplegado, puedes verificar que todos los servicios (Blockchain, AI, IPFS, DB) están conectados accediendo a:

`https://<tu-worker-subdominio>.workers.dev/api/admin/verify-full-stack`

Esto ejecutará una prueba completa simulada que:
1. Genera un certificado de prueba.
2. Calcula su hash SHA-256.
3. Lo sube a Pinata (IPFS).
4. Lo registra en Hedera, XRP y Algorand.
5. Guarda el registro en MongoDB y D1.

## 4. Solución de Problemas
- Si obtienes error `CLOUDFLARE_API_TOKEN`, ejecuta `npx wrangler login` manualmente.
- Si obtienes error de logs, asegúrate de tener permisos de escritura en tu carpeta de usuario.
