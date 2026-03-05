# Instrucciones de Despliegue - AcademicChain Ledger

## 1. Requisitos Previos
- Node.js instalado.
- Cuenta de Cloudflare activa.
- Git instalado.

## 2. Autenticación en Cloudflare (IMPORTANTE)
Antes de desplegar, debes iniciar sesión en Cloudflare Workers desde tu terminal:

```bash
cd worker
npx wrangler login
```

Esto abrirá una ventana del navegador para autorizar el acceso.

## 3. Despliegue Automático
Hemos creado un script robusto para manejar el despliegue y evitar errores comunes de logs:

```bash
# Desde la carpeta raíz del proyecto
node worker/deploy.cjs
```

O manualmente:
```bash
cd worker
npm run deploy
```

## 4. Verificación de Conexiones (Proof of Work)
Para verificar que todas las conexiones (Blockchain, AI, IPFS, DB) funcionan correctamente antes de desplegar:

```bash
cd worker
npx tsx proof_of_work.ts
```

Esto generará un reporte detallado en `proof_of_work.txt` mostrando:
1. Generación de certificado de prueba.
2. Cálculo de hash SHA-256.
3. Subida a Pinata (IPFS).
4. Registro en Hedera (Consensus), XRP (Ledger) y Algorand (Asset).
5. Guardado en base de datos (MongoDB/D1).

## 5. Endpoints Disponibles
Una vez desplegado, el Worker expondrá:
- `POST /api/creators/issue-full`: Emisión completa multi-chain.
- `GET /api/admin/verify-full-stack`: Verificación de estado del sistema.

## 6. Solución de Problemas
- **Error "You are not authenticated"**: Ejecuta `npx wrangler login`.
- **Error de logs ENOENT**: El script `deploy.cjs` maneja esto automáticamente suprimiendo logs innecesarios.
