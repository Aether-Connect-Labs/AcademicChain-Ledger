# 🎓 AcademicChain Ledger

## Propuesta de Valor
Solución end-to-end para emisión y verificación de credenciales académicas en blockchain. Combina la velocidad y bajo costo de Hedera con la seguridad y descentralización de XRP para ofrecer verificación en segundos y costos mínimos.

## Para audiencias menos técnicas (inversores, clientes)
### Problema
Las credenciales académicas falsas cuestan miles de millones anualmente; la verificación manual es lenta y costosa.
### Solución
Plataforma blockchain que transforma títulos universitarios en certificados digitales inalterables y verificables instantáneamente.
### ¿Cómo funciona?
1. Las instituciones emiten títulos como activos digitales únicos (NFTs) con metadatos inmutables.
2. Los estudiantes reciben un QR/URL vinculado a su credencial.
3. Cualquier empleador escanea el QR y verifica su autenticidad en segundos.
### Ventajas clave
- Verificación instantánea (segundos vs días/semanas).
- Imposible de falsificar (tecnología blockchain).
- Costo mínimo por emisión (< $0.01 en algunas redes).
- Auditoría pública transparente.
- Experiencia sin fricción para todos los usuarios.

## Para audiencias técnicas (developers)
### Tecnologías principales
![Hedera](https://img.shields.io/badge/Hedera-Hashgraph-blue) ![XRP](https://img.shields.io/badge/XRP-Ledger-purple) ![IPFS](https://img.shields.io/badge/IPFS-Descentralizado-green) ![Node.js](https://img.shields.io/badge/Node.js-Express-yellow) ![React](https://img.shields.io/badge/React-Vite-red)

### Características principales
- Emisión tokenizada: Conversión de títulos/certificados en NFTs con metadatos inmutables (HIP‑412).
- Verificación dual: Validación on-chain vía QR/URL consultando Hedera y XRP.
- Flujo completo: Autenticación OAuth → Dashboard institución → Emisión individual/masiva → Verificación pública.
- Arquitectura dual: Hedera para NFTs; XRP para auditoría cruzada y resiliencia.
- Gestión multi‑rol: Paneles diferenciados para admin, instituciones y estudiantes.
- Infraestructura robusta: IPFS, CSP endurecido, herramientas de auditoría y exportación CSV.

### Diagrama de arquitectura
Consulta la sección `🔄 Flujo Dual Ledger: Hedera + XRP` más abajo para ver el diagrama de secuencia y el flujo detallado.

## ✨ Características
- Registro inmutable de credenciales (Hedera Hashgraph)
- Almacenamiento descentralizado (Pinata/IPFS)
- Autenticación segura (JWT)
- Anclaje opcional en XRP Ledger (XRPL)
- Arquitectura Node.js lista para Docker

---

## 🏁 Inicio Rápido (Paso a paso)

### 1) Prerrequisitos
- Node.js 22.x
- npm
- Git
- Docker Desktop (recomendado para MongoDB y Redis)

### 2) Clonar e instalar
```bash
git clone <URL-DEL-REPOSITORIO>
cd AcademicChain-Ledger
npm install
```

### 3) Configurar entorno
- Ejecuta el asistente y sigue las instrucciones:
```bash
node setup-env.js
```
- Variables mínimas a tener en cuenta:
  - En `server/.env`:
    - `MONGODB_URI=mongodb://localhost:27017/academicchain`
    - `REDIS_URL=redis://localhost:6379` (opcional en desarrollo)
    - `CLIENT_URL=http://localhost:5173`
    - `HEDERA_NETWORK=testnet|mainnet`
    - `HEDERA_ACCOUNT_ID=0.0.<ID>`
    - `HEDERA_PRIVATE_KEY=<CLAVE_PRIVADA>`
    - `XRPL_ENABLED=true|false`
    - `XRPL_NETWORK=testnet|mainnet`
    - `XRPL_SEED=<SEED_O_SECRET_DE_LA_WALLET_DEL_SERVICIO>`
  - En `client/.env.local`:
    - `VITE_API_URL=http://localhost:3001`
    - `VITE_WS_URL=http://localhost:3001`
    - `VITE_ALLOW_OWNER=1`
    - `VITE_PREVIEW_OWNER_EMAIL=<correo_del_propietario>`
    - `VITE_HEDERA_NETWORK=testnet|mainnet`
  - En `server/.env` (solo desarrollo):
    - `PREVIEW_OWNER_EMAIL=<correo_del_propietario>`
    - `PREVIEW_OWNER_PASSWORD=<contraseña_del_propietario>`

### 4) Levantar servicios (MongoDB/Redis)
- Opción A (recomendada):
```bash
docker compose -f docker-compose-services.yml up -d
```
- Opción B (alternativa):
```bash
npm run docker:up
```

### 5) Ejecutar en desarrollo
```bash
npm run dev
```
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173` (puede variar a `http://localhost:5174`)

## 🔒 Modo Propietario (Preview)
- Disponible solo en desarrollo (`NODE_ENV=development`).
- Configura en `server/.env` `PREVIEW_OWNER_EMAIL` y `PREVIEW_OWNER_PASSWORD`.
- En `client/.env.local` activa `VITE_ALLOW_OWNER=1` y define `VITE_PREVIEW_OWNER_EMAIL`.
- En la pantalla de inicio de sesión verás el botón `Entrar como Propietario (desarrollo)` o inicia con las credenciales configuradas.
- Para salir, abre el menú de usuario y usa `Salir del modo propietario`.

### 6) Verificación rápida
- Salud del backend: `http://localhost:3001/health` y `http://localhost:3001/ready`
- Emisión individual: en el dashboard, usa “Emitir Título”
- Emisión masiva: en el dashboard, usa “Subir Excel”, indicando el `Token ID`
- Progreso de trabajos: se actualiza en tiempo real vía WebSocket

### 🔗 Conexión de Wallets
- Hedera (HashPack):
  - Instala la extensión HashPack.
  - En el frontend, pulsa “Conectar Wallet”. La red usada es `VITE_HEDERA_NETWORK`.
  - Asegúrate de tener HBAR suficientes para mint/transfer HTS.
- XRP (XRPL):
  - Si `XRPL_ENABLED=true`, el servidor anclará cada emisión con un pago mínimo y Memo JSON.
  - Variables: `XRPL_NETWORK`, `XRPL_SEED`.
  - Más adelante se puede habilitar firma por usuario con XUMM (requiere SDK/endpoint adicional).

#### Comandos de verificación (Windows PowerShell)
```powershell
# Health
Invoke-RestMethod -Uri 'http://localhost:3001/health' | ConvertTo-Json -Compress

# Ready
Invoke-RestMethod -Uri 'http://localhost:3001/ready' | ConvertTo-Json -Compress

# Preview login (modo propietario en desarrollo)
$body = @{ email='<correo_del_propietario>'; password='<clave_del_propietario>' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/auth/preview-login' -ContentType 'application/json' -Body $body | ConvertTo-Json -Compress
```

#### Alternativa con cURL
```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/ready
curl -s -X POST http://localhost:3001/api/auth/preview-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<correo_del_propietario>","password":"<clave_del_propietario>"}'
```

#### Ejemplos de emisión y paginación
```powershell
# Obtener token de propietario (desarrollo)
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/auth/preview-login' -ContentType 'application/json' -Body (@{ email='<correo>'; password='<clave>' } | ConvertTo-Json)
$token = $login.token

# Preparar emisión individual
$prepareBody = @{ tokenId='0.0.<TOKEN_ID>'; uniqueHash='UNIQ-123'; ipfsURI='ipfs://<CID>'; recipientAccountId='0.0.<STUDENT_ID>' } | ConvertTo-Json
$prepare = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/universities/prepare-issuance' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $prepareBody
$transactionId = $prepare.data.transactionId

# Ejecutar emisión (sin pago en desarrollo)
$execBody = @{ transactionId=$transactionId } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/universities/execute-issuance' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $execBody | ConvertTo-Json -Compress

# Listar credenciales con paginación
Invoke-RestMethod -Uri 'http://localhost:3001/api/universities/credentials?page=1&limit=10&sort=desc&sortBy=createdAt' -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Compress
```

```bash
# Obtener token (cURL)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/preview-login -H 'Content-Type: application/json' -d '{"email":"<correo>","password":"<clave>"}' | jq -r '.token')

# Preparar emisión
curl -s -X POST http://localhost:3001/api/universities/prepare-issuance \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.<TOKEN_ID>","uniqueHash":"UNIQ-123","ipfsURI":"ipfs://<CID>","recipientAccountId":"0.0.<STUDENT_ID>"}'

# Ejecutar emisión (sin pago)
curl -s -X POST http://localhost:3001/api/universities/execute-issuance \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"transactionId":"<transactionId>"}'

# Listar credenciales
curl -s -X GET 'http://localhost:3001/api/universities/credentials?page=1&limit=10&sort=desc&sortBy=createdAt' \
  -H "Authorization: Bearer $TOKEN"
```

#### Exportar credenciales a CSV
```powershell
# CSV con filtro opcional por token
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=desc&sortBy=createdAt&tokenId=0.0.<TOKEN_ID>'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials.csv"
```

```bash
# CSV con filtro opcional por token
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=desc&sortBy=createdAt&tokenId=0.0.<TOKEN_ID>' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials.csv
```

```powershell
# CSV sin filtro (todos)
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=desc&sortBy=createdAt'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials_all.csv"

# CSV por alumno (accountId)
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&accountId=0.0.<ACCOUNT_ID>&page=1&limit=200&sort=desc&sortBy=createdAt'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials_by_account.csv"
```

```bash
# CSV sin filtro (todos)
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=desc&sortBy=createdAt' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials_all.csv

# CSV por alumno (accountId)
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&accountId=0.0.<ACCOUNT_ID>&page=1&limit=200&sort=desc&sortBy=createdAt' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials_by_account.csv
```

```powershell
# CSV ordenado por serial (ascendente)
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=asc&sortBy=serialNumber'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials_by_serial.csv"
```

```bash
# CSV ordenado por serial (ascendente)
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&page=1&limit=200&sort=asc&sortBy=serialNumber' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials_by_serial.csv
```

```powershell
# CSV por token y orden por serial ascendente
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&tokenId=0.0.<TOKEN_ID>&page=1&limit=200&sort=asc&sortBy=serialNumber'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials_token_serial.csv"

# CSV por alumno y orden por serial ascendente
$csvUrl = 'http://localhost:3001/api/universities/credentials?format=csv&accountId=0.0.<ACCOUNT_ID>&page=1&limit=200&sort=asc&sortBy=serialNumber'
Invoke-WebRequest -Uri $csvUrl -Headers @{ Authorization = "Bearer $token" } -OutFile ".\\credentials_account_serial.csv"
```

```bash
# CSV por token y orden por serial ascendente
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&tokenId=0.0.<TOKEN_ID>&page=1&limit=200&sort=asc&sortBy=serialNumber' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials_token_serial.csv

# CSV por alumno y orden por serial ascendente
curl -s -X GET 'http://localhost:3001/api/universities/credentials?format=csv&accountId=0.0.<ACCOUNT_ID>&page=1&limit=200&sort=asc&sortBy=serialNumber' \
  -H "Authorization: Bearer $TOKEN" \
  -o credentials_account_serial.csv
```

## 🔧 Scripts útiles
- `npm run client:dev`: inicia solo el frontend

## 🚀 Emisión en Render (Producción)

- Base de la API: `https://academicchain-ledger-b2lu.onrender.com`
- Salud del servicio: `GET /health`, `GET /ready`
- Autenticación:
  - Email/Password: `POST /api/auth/register` y `POST /api/auth/login`
  - Google OAuth: `GET /api/auth/google?redirect_uri=<CLIENT_URL>`; tras login, el API redirige con `token`
- Emisión individual:
  - Preparar: `POST /api/universities/prepare-issuance` con `tokenId`, `uniqueHash`, `ipfsURI` y opcional `recipientAccountId`
  - Ejecutar: `POST /api/universities/execute-issuance` con `transactionId`
- Verificación en la red:
  - Hedera (HashScan testnet): `https://hashscan.io/testnet/token/{tokenId}`, `https://hashscan.io/testnet/nft/{tokenId}-{serialNumber}`, `https://hashscan.io/testnet/transaction/{transactionId}`
  - XRPL (testnet|mainnet): `https://testnet.xrpl.org/transactions/{xrpTxHash}` o `https://livenet.xrpl.org/transactions/{xrpTxHash}`

### Ejemplo cURL (Producción)

```bash
API="https://academicchain-ledger-b2lu.onrender.com"

# Login (email/password)
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"<tu_email>","password":"<tu_password>"}' | jq -r '.token')

# Crear token académico (si no tienes uno todavía)
curl -s -X POST "$API/api/universities/create-token" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tokenName":"Demo Credential","tokenSymbol":"DEMO_'$(date +%s)'","tokenMemo":"Demo issuance token"}'

# Preparar emisión
curl -s -X POST "$API/api/universities/prepare-issuance" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.<TOKEN_ID>","uniqueHash":"DEMO-'$(uuidgen)'","ipfsURI":"ipfs://<CID>"}'

# Ejecutar emisión
curl -s -X POST "$API/api/universities/execute-issuance" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"transactionId":"<TRANSACTION_ID>"}'

# Verificar credencial por API
curl -s "$API/api/verification/verify/0.0.<TOKEN_ID>/<SERIAL_NUMBER>"

# Listar credenciales y ver el anclaje XRPL (xrpTxHash)
curl -s "$API/api/universities/credentials?tokenId=0.0.<TOKEN_ID>&page=1&limit=10&sort=desc" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

### Variables Render recomendadas
- Backend (Service):
  - `NODE_ENV=production`
  - `RENDER_EXTERNAL_URL=https://<tu-api>.onrender.com`
  - `SERVER_URL=https://<tu-api>.onrender.com`
  - `CLIENT_URL=https://<tu-web>.onrender.com`
  - `JWT_SECRET=<secreto>`
  - `MONGODB_URI=<cadena>`
  - `HEDERA_NETWORK=mainnet` y credenciales de operador (`HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`)
  - `XRPL_ENABLED=true` (si deseas anclaje), `XRPL_NETWORK=mainnet`, `XRPL_SEED=<seed del servicio>`
- Frontend (Static):
  - `VITE_API_URL=https://<tu-api>.onrender.com`
  - `VITE_HEDERA_NETWORK=mainnet`
```

### Notas de Producción
- `PAYMENT_TOKEN_ID` es opcional. Si no se define, el flujo usa la ruta sin cobro.
- `ipfsURI` debe apuntar a un CID válido de un JSON HIP‑412 para que la verificación recupere metadata desde IPFS.
- El anclaje XRPL incluye `MemoType=ACAD` y `MemoData` con `certificateHash`, `hederaTokenId`, `serialNumber`, `timestamp`.
- Para CSV de auditoría en producción, usa los mismos endpoints con `format=csv` y tu `Authorization`.

## 📈 Plan de Validación y Verificación Dual

### PRIORIDAD 1: Prueba en Testnet

- Objetivo: validar experiencia end‑to‑end en práctica.
- Checklist:
  - [ ] Ejecutar `POST /api/universities/issue-credential` para un título de prueba
  - [ ] Confirmar respuesta con `nftId`, `hashscanUrl`, `xrpTxHash`, `xrplUrl`
  - [ ] Verificación en HashScan del `nftId` (name, properties.title, issuer, issue_date)
  - [ ] Verificación en XRPL del `xrpTxHash` (Memo ACAD, certificateHash, serialNumber, issuer)
  - [ ] `GET /api/verification/verify/{tokenId}/{serialNumber}` o `GET /api/verification/verify/{nftId}` con URLs de verificación

### PRIORIDAD 2: Flujo de Verificación para Reclutadores (3 Pasos)

- Paso 1: Obtén el ID del título (ej. `0.0.12345-789` o QR)
- Paso 2: Visita `tudominio.com/verify` e ingresa el ID
- Paso 3: Confirma autenticidad
  - ✅ Éxito: nombre del graduado, título, fecha, universidad y botones HashScan/XRPL
  - ❌ Fallo: “Credencial no encontrada o inválida”
  - Contacto: `verificaciones@tudominio.com`

### PRIORIDAD 3: Camino a Verifiable Credentials (VCs)

- Fase 1 (Ahora): añadir en HIP‑412
  - `properties.vc_ready = "true"`
  - `properties.vc_schema = "https://schema.org/EducationalOccupationalCredential"`
- Fase 2: endpoint de transformación
  - `POST /api/vc/issue/{nftId}` → VC firmado con DID, compatible hacia atrás
- Fase 3: Portabilidad SSI
  - Integración con wallets SSI y verificación offline

### Plantilla Sprint

```markdown
## OBJETIVO SPRINT: Validación End-to-End
- [ ] Emitir 3 títulos de prueba en Testnet
- [ ] Completar checklist de verificación dual
- [ ] Documentar flujo de 3 pasos para reclutadores
- [ ] Corregir cualquier discrepancia encontrada

## CRITERIOS DE ACEPTACIÓN:
- Un reclutador técnico puede verificar un título en < 60 segundos
- Los datos entre Hedera y XRPL son consistentes
- La UI de verificación es intuitiva para no técnicos
```

## 🔗 XRP + Hedera (Dual Ledger)


### Variables de entorno (server/.env)
- `XRPL_ENABLE=1` o `XRPL_ENABLED=true` para habilitar la funcionalidad.
- `XRP_ANCHOR_FEE=0.000001` monto mínimo en XRP para el anclaje.
- `XRP_BACKUP_WALLET=<destino_opcional>` si quieres enviar el pago/memo a una billetera backup.

### Cómo funciona
- Emisión:
  - Tras mintear la credencial en Hedera, se ejecuta el anclaje en XRPL mediante un pago con `Memo` que incluye `certificateHash`, `hederaTokenId`, `serialNumber` y `timestamp`.
  - Referencia: `server/src/services/xrpService.js:42-85`.
- Verificación API:
  - Las rutas de verificación enriquecen la respuesta con `xrpAnchor` si existe.
  - Referencias: `server/src/routes/verification.js:55`, `server/src/routes/verification.js:224`, y HTML con enlace a XRPL explorer `server/src/routes/verification.js:198-206`.
- Panel Admin:
  - Endpoints: `GET /api/admin/xrp/balance` y `GET /api/admin/hedera/balance`.
  - Referencia: `server/src/routes/admin.js:59-83`.
- Cliente (UI):
  - Sidebar Admin muestra estado/red/dirección/balance de XRP y balance API de Hedera.
  - Referencias: `client/components/AdminSidebar.jsx:19`, `client/components/AdminSidebar.jsx:56-85`, `client/components/AdminSidebar.jsx:275-291`.
  - Emisión masiva muestra ancla XRP por fila y enlace de verificación dual.
  - Referencias: `client/components/BatchIssuance.jsx:16-48`, `client/components/BatchIssuance.jsx:690-719`.

### Pasos para habilitar y probar
- Configura variables en `server/.env`:
  - `XRPL_ENABLE=1`
  - `XRPL_NETWORK=testnet`
  - `XRPL_SEED=<seed_testnet>`
  - `XRP_ANCHOR_FEE=0.000001`
- Inicia servicios y app:
  - `docker compose -f docker-compose-services.yml up -d`
  - `npm run dev`
- Verificación por API:
  - `POST /api/verification/verify-credential` con `{ tokenId, serialNumber }` → respuesta incluye `data.xrpAnchor` cuando hay ancla.
  - `GET /api/verification/verify/:tokenId/:serialNumber` con `Accept: text/html` → muestra HTML con enlaces a Hashscan y XRPL.
- Verificación por UI:
  - En el Admin Sidebar confirma estado/red/Balance XRP.
  - En Emisión Masiva, al finalizar, verifica cada fila con “Dual (Hedera+XRP)”.

### Comandos útiles (Windows PowerShell)
```powershell
[Environment]::SetEnvironmentVariable('XRPL_ENABLE','1','User')
[Environment]::SetEnvironmentVariable('XRPL_NETWORK','testnet','User')
[Environment]::SetEnvironmentVariable('XRPL_SEED','<seed_testnet>','User')
[Environment]::SetEnvironmentVariable('XRP_ANCHOR_FEE','0.000001','User')
```

### Monitorización
- `GET /health`, `GET /healthz` y `GET /ready` incluyen estado XRPL.
- En el Dashboard de institución puedes abrir la verificación web (Hedera + XRP).

## 🔄 Flujo Dual Ledger: Hedera + XRP

### Diagrama de Secuencia
```
1. [Universidad] → [AcademicChain API]
   │
   ├── Emisión de Credencial:
   │   ├── 1. Hedera HTS: Mint NFT con metadata completa
   │   ├── 2. Generar Hash único de la credencial
   │   └── 3. XRP Ledger: Anclar hash + referencias
   │
   ├── Verificación:
   │   ├── ✅ Hedera: Validar NFT y datos completos
   │   └── ✅ XRP: Verificar proof de existencia
   │
   └── Recuperación:
       ├── Hedera primario: Datos completos
       └── XRP secundario: Proof de backup
```

### Flujo Detallado

#### Emisión de Credencial
```javascript
// 1) HEDERA (Primary - datos completos)
const tokenId = '0.0.123456';
const metadata = {
  university: 'Universidad Nacional',
  degree: 'Computer Science',
  studentId: 'student_001',
  graduationDate: '2024-01-15',
  uniqueHash: 'sha256_demo_abc123', // requerido para anclaje y consistencia
  ipfsURI: 'ipfs://<CID>'
};
const hederaResult = await hederaService.mintAcademicCredential(tokenId, metadata);
// { serialNumber, transactionId }

// 2) XRP (Secondary - proof de existencia)
const xrpResult = await xrpService.anchor({
  certificateHash: metadata.uniqueHash,
  hederaTokenId: tokenId,
  serialNumber: hederaResult.serialNumber,
  timestamp: new Date().toISOString()
});
// { xrpTxHash, network, status, ... }

// 3) Respuesta Dual
return {
  hedera: {
    transactionId: hederaResult.transactionId,
    tokenId,
    serialNumber: hederaResult.serialNumber,
    explorerUrl: `https://hashscan.io/${process.env.HEDERA_NETWORK || 'testnet'}/token/${tokenId}`
  },
  xrp: {
    transactionHash: xrpResult.xrpTxHash,
    explorerUrl: xrpResult.xrpTxHash ? `https://testnet.xrplexplorer.com/tx/${xrpResult.xrpTxHash}` : null
  }
};
```

#### Verificación Dual
```javascript
// Verificación paralela en ambos libros contables
const hederaVerification = await hederaService.verifyCredential(tokenId, serialNumber);
const xrpAnchor = await xrpService.getByTokenSerial(tokenId, serialNumber);
const xrpExists = !!xrpAnchor;

return {
  valid: hederaVerification.valid && xrpExists,
  credential: hederaVerification.credential,
  verification: {
    hedera: {
      valid: hederaVerification.valid,
      explorerUrl: `https://hashscan.io/${process.env.HEDERA_NETWORK || 'testnet'}/token/${tokenId}`
    },
    xrp: {
      anchored: xrpExists,
      txHash: xrpAnchor?.xrpTxHash || null,
      explorerUrl: xrpAnchor?.xrpTxHash ? `https://testnet.xrplexplorer.com/tx/${xrpAnchor.xrpTxHash}` : null
    }
  },
  securityLevel: hederaVerification.valid && xrpExists ? 'ENTERPRISE_DUAL' : 'STANDARD'
};
```

#### Escenarios de Recuperación
```
Caso 1: Hedera disponible, XRP disponible
✅ Estado óptimo — Verificación dual completa
• Hedera: Datos completos + validación
• XRP: Proof de existencia + timestamp

Caso 2: Hedera temporalmente no disponible
⚠️ Estado degradado — Verificación vía XRP
• XRP: Proof de que la credencial existió
• Timestamp de emisión verificable
• Recuperación completa cuando Hedera regrese

Caso 3: Fallo de comunicación
🔄 Recovery automático
• Servicios de recuperación y scripts disponibles
• Migración masiva para re-sincronización
• Consistency checks periódicos
```

### Métricas del Sistema Dual
```bash
# Estado del sistema
curl https://academicchain-ledger-b2lu.onrender.com/health

# Ejemplo (campo XRPL incluido)
{
  "status": "OK",
  "environment": "production",
  "xrpl": { "enabled": true, "network": "testnet" },
  "timestamp": "2025-01-15T02:00:00Z"
}
```

### Monitoreo y Alertas
- Health checks periódicos (`/health`, `/healthz`, `/ready`).
- Scripts de consistencia y migración:
  - `node server/src/scripts/consistencyCheck.js`
  - `node server/src/scripts/massMigration.js`
- Métricas del sistema: `GET /metrics` (Prometheus) y `GET /metrics/json` (admin).

## 🛡️ Robustez y Monitorización Mejorada

### Socket.io con reconexión inteligente
- Reconexión con backoff exponencial y fallback a polling si el WS falla.
- Reporte de estado de conexión del dashboard al backend (`POST /metrics/connection`).
- Heartbeat configurable con `SOCKET_HEARTBEAT_TIMEOUT_MS`.
- Referencia de UI: `client/components/RateDashboard.jsx`.

### Runtime Health Monitor (servicios críticos)
- Servicios monitorizados: MongoDB, Redis, Hedera, XRPL, Rate Oracle.
- Emite eventos por WebSocket: `health:update` y alertas `system:alert`.
- Umbral de degradación configurable: `RUNTIME_DEGRADE_THRESHOLD_MS`.
- Intervalos configurables: `RUNTIME_MONITOR_INTERVAL_MS`, `RUNTIME_HEALTH_EMIT_INTERVAL_MS`.
- Forzar chequeo sin caché del oráculo: `RUNTIME_RATE_CHECK_NOCACHE=1`.
- Endpoint detallado (admin): `GET /api/admin/health/detailed`.
- Implementación: `server/src/middleware/runtimeHealth.js`.

### Timeouts configurables (prioridad por entorno)
- Variables soportadas:
  - `RATE_ORACLE_TIMEOUT_MS`, `HEDERA_TIMEOUT_MS`, `XRPL_TIMEOUT_MS`, `REDIS_TIMEOUT_MS`, `MONGO_TIMEOUT_MS`, `EXTERNAL_API_TIMEOUT_MS`, `SOCKET_HEARTBEAT_TIMEOUT_MS`, `API_REQUEST_TIMEOUT_MS`.
- Prioridad: variable de entorno > defaults por `NODE_ENV` (development/production).
- Helpers disponibles: `TimeoutManager.createAbortSignal`, `TimeoutManager.fetchWithTimeout`, `TimeoutManager.promiseWithTimeout`.
- Implementación: `server/src/utils/timeoutConfig.js`.

### Códigos de error estandarizados
- Respuestas JSON uniformes vía middleware de errores.
- Códigos principales: `API_VALID_001`, `RATE_CONN_001`, `RATE_TIMEOUT_001`, `HEDERA_CONN_001`, `XRPL_CONN_001`, etc.
- Uso recomendado: `throw createError('RATE_TIMEOUT_001', 'Rate oracle timeout', 504)`.
- Referencias: `server/src/utils/errorCodes.js` y `docs/ERROR_CODES.md`.

### Rutas del sistema (admin)
- `GET /api/system/timeouts`: muestra valores efectivos de timeouts.
- `GET /api/system/error-codes`: lista de códigos de error disponibles.

### Readiness y salud
- `/ready` valida Mongo/Redis (si no están deshabilitados), XRPL (si está habilitado) y frescura del Rate Oracle.
- El oráculo se considera fresco si `ageSeconds <= 3900` (≈1h + tolerancia).
- Referencia: `server/src/app.js`.

### Métricas Prometheus extendidas
- `GET /metrics` expone:
  - `xrphbar_service_health`, `xrphbar_service_latency_seconds`, `xrphbar_hedera_balance_hbars`.
  - `xrphbar_rate_source_status` (Binance/Coinbase/Kraken/HederaMirror).
  - `xrphbar_error_total` (connection/timeout/validation).
  - `xrphbar_operation_duration_seconds` (rate_fetch/hedera_transfer/xrpl_payment).
- Implementación: `server/src/services/metricsService.js` y `server/src/routes/metrics.js`.

### Comandos rápidos (PowerShell)
```powershell
# Readiness
Invoke-RestMethod -Uri 'http://localhost:3001/ready' | ConvertTo-Json -Compress

# Métricas (Prometheus)
Invoke-RestMethod -Uri 'http://localhost:3001/metrics' | Select-Object -First 20

# Timeouts efectivos (admin)
$token = '<Bearer JWT admin>'
Invoke-RestMethod -Uri 'http://localhost:3001/api/system/timeouts' -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Compress

# Códigos de error (admin)
Invoke-RestMethod -Uri 'http://localhost:3001/api/system/error-codes' -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Compress
```
