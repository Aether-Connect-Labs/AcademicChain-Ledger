# 🎓 AcademicChain Ledger

Plataforma para emitir y verificar credenciales académicas utilizando Hedera Hashgraph e IPFS.

## ✨ Características
- Registro inmutable de credenciales (Hedera Hashgraph)
- Almacenamiento descentralizado (Pinata/IPFS)
- Autenticación segura (JWT)
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
  - En `client/.env.local`:
    - `VITE_API_URL=http://localhost:3001`
    - `VITE_WS_URL=http://localhost:3001`
    - `VITE_ALLOW_OWNER=1`
    - `VITE_PREVIEW_OWNER_EMAIL=<correo_del_propietario>`
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

### 7) Problemas comunes
- Errores de conexión a MongoDB: asegúrate de que el contenedor de Mongo esté corriendo (`docker ps`) o ajusta `MONGODB_URI`
- WebSocket bloqueado por CORS: verifica `CLIENT_URL` en `server/.env` incluye el puerto del frontend
- Vite cambia a `5174`: actualiza `CLIENT_URL` y abre el frontend en el nuevo puerto
 - Redis no disponible (`ECONNREFUSED 127.0.0.1:6379`): levanta Redis con `docker compose -f docker-compose-services.yml up -d` o usa `REDIS_URL` de Redis Cloud. En desarrollo, las colas se deshabilitan automáticamente si Redis no está disponible.
 - Puerto `3001` en uso (`EADDRINUSE`): cierra procesos previos del backend y vuelve a ejecutar `npm run server:dev` o `npm run dev` en una única terminal.
 - Docker no instalado/activo: usa MongoDB Atlas y Redis Cloud ajustando `MONGODB_URI` y `REDIS_URL` en `server/.env`.

---

## 📂 Estructura del Proyecto
- `server/`: API Node.js (Express, Socket.io, BullMQ)
- `client/`: Frontend React (Vite)
- `contracts/`: Contratos y scripts relacionados
- `docker-compose*.yml`: Servicios de MongoDB y Redis

## 🔧 Scripts útiles
- `npm run dev`: inicia cliente y servidor en paralelo
- `npm run server:dev`: inicia solo el backend
- `npm run client:dev`: inicia solo el frontend
- `npm run docker:up`: levanta Mongo/Redis con Docker
- `npm run test`: ejecuta los tests (client y server)

## 🛡️ Ambiente y seguridad
- `.env` y secretos no se commitean
- No expongas claves privadas en logs o código

## 📦 Despliegue
- Vercel configurado para frontend y API serverless (`deployment/README.md`)

AcademicChain Ledger es una plataforma diseñada para la gestión y verificación de credenciales académicas utilizando tecnología blockchain y descentralizada. Este sistema proporciona una forma segura, inmutable y transparente de emitir, almacenar y compartir logros académicos.

## ✨ Características Principales

- **Registro Inmutable**: Utiliza Hedera Hashgraph para registrar credenciales de forma segura.
- **Almacenamiento Descentralizado**: Guarda los documentos asociados en la red de Pinata (IPFS).
- **Autenticación Segura**: Implementa JWT para la gestión de sesiones y protección de rutas.
- **Arquitectura Escalable**: Construido sobre Node.js y preparado para funcionar con contenedores de Docker.

---

## 🚀 Guía de Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo local.

### 1. Prerrequisitos

Asegúrate de tener instalado el siguiente software en tu sistema:

- **Node.js**: Versión 18.x o superior.
- **npm**: Gestor de paquetes de Node.js (generalmente se instala con Node.js).
- **Git**: Para clonar el repositorio.
- **Docker**: Para gestionar los servicios de base de datos y caché.

### 2. Clonar el Repositorio

Abre tu terminal y clona el repositorio del proyecto en tu máquina local.

```bash
git clone <URL-DEL-REPOSITORIO>
cd AcademicChain-Ledger
```

### 3. Instalar Dependencias

Instala todas las dependencias del proyecto definidas en el archivo `package.json`.

```bash
npm install
```

### 4. Configurar las Variables de Entorno

El proyecto incluye un script interactivo para configurar todas las credenciales y secretos necesarios. Antes de ejecutarlo, asegúrate de tener a mano la siguiente información:

- Tu **Hedera Account ID** y **Private Key**.
- Tu **Pinata API Key** y **Secret Key**.
- La **URI de conexión** a tu base de datos MongoDB Atlas.
- La **URI de conexión** a tu instancia de Redis Cloud.

Ahora, ejecuta el script de configuración:

```bash
node setup-env.js
```

El script te guiará, generará los secretos de seguridad y creará un archivo `.env` en la raíz del proyecto. Este archivo es ignorado por Git para proteger tus credenciales.

### 5. Iniciar los Servicios con Docker

El proyecto utiliza Docker para orquestar los servicios necesarios como la base de datos. Ejecuta el siguiente comando para levantar los contenedores:

```bash
npm run docker:up
```

### 6. Ejecutar la Aplicación

¡Todo está listo! Ahora puedes iniciar el servidor de desarrollo.

```bash
npm run dev
```

Frontend: `http://localhost:5173` (Vite puede cambiar a `http://localhost:5174`)
API backend: `http://localhost:3001`

<!--
[PROMPT_SUGGESTION]¿Puedes añadir una sección de "Estructura del Proyecto" al README para explicar las carpetas `server`, `client` y `contracts`?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]¿Cómo puedo mejorar el script `setup-env.js` para que oculte la entrada de la clave privada?[/PROMPT_SUGGESTION]
-->
# 🎓 AcademicChain Ledger

AcademicChain Ledger es una plataforma diseñada para la gestión y verificación de credenciales académicas utilizando tecnología blockchain y descentralizada. Este sistema proporciona una forma segura, inmutable y transparente de emitir, almacenar y compartir logros académicos.

## ✨ Características Principales

- **Registro Inmutable**: Utiliza Hedera Hashgraph para registrar credenciales de forma segura.
- **Almacenamiento Descentralizado**: Guarda los documentos asociados en la red de Pinata (IPFS).
- **Autenticación Segura**: Implementa JWT para la gestión de sesiones y protección de rutas.
- **Arquitectura Escalable**: Construido sobre Node.js y preparado para funcionar con contenedores de Docker.

---

## 🚀 Guía de Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo local.

### 1. Prerrequisitos

Asegúrate de tener instalado el siguiente software en tu sistema:

- **Node.js**: Versión 18.x o superior.
- **npm**: Gestor de paquetes de Node.js (generalmente se instala con Node.js).
- **Git**: Para clonar el repositorio.
- **Docker**: Para gestionar los servicios de base de datos y caché.

### 2. Clonar el Repositorio

Abre tu terminal y clona el repositorio del proyecto en tu máquina local.

```bash
git clone <URL-DEL-REPOSITORIO>
cd AcademicChain-Ledger
```

### 3. Instalar Dependencias

Instala todas las dependencias del proyecto.

```bash
npm install
```

### 4. Configurar las Variables de Entorno

El proyecto incluye un script interactivo para configurar todas las credenciales y secretos necesarios. Antes de ejecutarlo, asegúrate de tener a mano la siguiente información:

- Tu **Hedera Account ID** y **Private Key**.
- Tu **Pinata API Key** y **Secret Key**.
- La **URI de conexión** a tu base de datos MongoDB Atlas.
- La **URI de conexión** a tu instancia de Redis Cloud.

Ahora, ejecuta el script de configuración:

```bash
node setup-env.js
```

El script te guiará, generará los secretos de seguridad y creará un archivo `.env` en la raíz del proyecto. Este archivo es ignorado por Git para proteger tus credenciales.

### 5. Iniciar los Servicios con Docker

El proyecto utiliza Docker para orquestar los servicios necesarios como la base de datos. Ejecuta el siguiente comando para levantar los contenedores:

```bash
npm run docker:up
```

### 6. Ejecutar la Aplicación

¡Todo está listo! Ahora puedes iniciar el servidor de desarrollo.

```bash
npm run dev
```

Frontend: `http://localhost:5173` (Vite puede cambiar a `http://localhost:5174`)
API backend: `http://localhost:3001`
-Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo local.
-### 1. Prerrequisitos
-Asegúrate de tener instalado el siguiente software en tu sistema:
-- Node.js: Versión 18.x o superior. -- npm: Gestor de paquetes de Node.js (generalmente se instala con Node.js). -- Git: Para clonar el repositorio. -- Docker: Para gestionar los servicios de base de datos y caché.
-### 2. Clonar el Repositorio
-Abre tu terminal y clona el repositorio del proyecto en tu máquina local.
-bash -git clone <URL-DEL-REPOSITORIO> -cd AcademicChain-Ledger -
-### 3. Instalar Dependencias
-Instala todas las dependencias del proyecto definidas en el archivo package.json.
-bash -npm install -
-### 4. Configurar las Variables de Entorno
-El proyecto incluye un script interactivo para configurar todas las credenciales y secretos necesarios. Antes de ejecutarlo, asegúrate de tener a mano la siguiente información:
-- Tu Hedera Account ID y Private Key. -- Tu Pinata API Key y Secret Key. -- La URI de conexión a tu base de datos MongoDB Atlas. -- La URI de conexión a tu instancia de Redis Cloud.
-Ahora, ejecuta el script de configuración:
-bash -node setup-env.js -
-El script te guiará, generará los secretos de seguridad y creará un archivo .env en la raíz del proyecto. Este archivo es ignorado por Git para proteger tus credenciales.
-### 5. Iniciar los Servicios con Docker
-El proyecto utiliza Docker para orquestar los servicios necesarios como la base de datos. Ejecuta el siguiente comando para levantar los contenedores:
-bash -npm run docker:up -
-### 6. Ejecutar la Aplicación
-¡Todo está listo! Ahora puedes iniciar el servidor de desarrollo.
-bash -npm run dev -
-La aplicación estará disponible en http://localhost:3001 (o el puerto que hayas configurado). + +La aplicación web estará disponible en la URL de tu cliente (por ejemplo, http://localhost:5173), mientras que la API se ejecutará en el puerto definido en tu archivo .env (por ejemplo, http://localhost:3001).


Con este cambio, tu `README.md` ahora tiene una guía de instalación limpia, profesional y precisa para cualquier persona que quiera usar tu proyecto.

<!--
[PROMPT_SUGGESTION]¿Puedes añadir una sección de "Estructura del Proyecto" al README para explicar las carpetas `server`, `client` y `contracts`?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]¿Cómo puedo mejorar el script `setup-env.js` para que oculte la entrada de la clave privada?[/PROMPT_SUGGESTION]
-->

Con estos cambios, cualquier desarrollador (incluido tú) solo necesitará seguir los nuevos y sencillos pasos del `README` para tener todo el entorno funcionando sin problemas.

<!--
[PROMPT_SUGGESTION]¿Puedes añadir una sección de "Estructura del Proyecto" al README para explicar las carpetas `server`, `client` y `contracts`?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]¿Cómo puedo hacer que el script `setup-env.js` oculte la entrada de la clave privada de Hedera?[/PROMPT_SUGGESTION]
-->

Con estos cambios, cualquier desarrollador (incluido tú) solo necesitará seguir los nuevos y sencillos pasos del `README` para tener todo el entorno funcionando sin problemas.

<!--
[PROMPT_SUGGESTION]¿Puedes añadir una sección de "Estructura del Proyecto" al README para explicar las carpetas `server`, `client` y `contracts`?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]¿Cómo puedo hacer que el script `setup-env.js` oculte la entrada de la clave privada de Hedera?[/PROMPT_SUGGESTION]
-->
## 🔗 XRP + Hedera (Dual Ledger)

- Anclaje secundario opcional en XRP Ledger para prueba de existencia y verificación cruzada.
- El flujo en Hedera no se interrumpe: si XRPL no está habilitado o falla, la emisión/verificación en Hedera sigue funcionando.

### Variables de entorno (server/.env)
- `XRPL_ENABLE=1` o `XRPL_ENABLED=true` para habilitar.
- `XRPL_NETWORK=testnet|mainnet` (por defecto `testnet`).
- `XRPL_SEED=<seed_de_la_wallet>` o `XRPL_SECRET=<secret>`.
- `XRPL_ADDRESS=<cuenta_opcional>` si quieres fijar la cuenta explícitamente.
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
// Verificación paralela en ambos ledgers
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
- Métricas del sistema: `GET /metrics` (requiere rol admin).
