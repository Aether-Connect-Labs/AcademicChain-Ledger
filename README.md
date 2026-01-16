# 🎓 AcademicChain Ledger — Credenciales Verificables en Tiempo Real

## 🚀 Propuesta de Valor
Plataforma end‑to‑end para emisión y verificación de credenciales académicas con evidencia criptográfica, auditoría pública y experiencia en tiempo real. El enfoque es cero fricción, precisión verificable y continuidad operativa, sin jerga cripto.

## 🏆 Para audiencias ejecutivas (inversores, clientes)
### 📊 Problema del Mercado
Las credenciales académicas falsas cuestan $600+ mil millones anuales globalmente; la verificación manual consume 5-15 días por credencial con costos de $30-100 USD cada una.

### 💡 Solución Innovadora
Transforma títulos y certificados en credenciales digitales inalterables con verificación instantánea, evidencia temporal y auditoría pública. Todo con una interfaz moderna y datos reales.

### ⚡ Flujo de Valor
1. **Emisión Institucional**: Universidades autorizadas emiten títulos como NFTs con metadatos inmutables
2. **Recepción Estudiantil**: Estudiantes reciben QR/URL vinculado a su credencial blockchain
3. **Verificación Employers**: Cualquier empleador verifica autenticidad en segundos escaneando QR

### 🎯 Ventajas Competitivas Clave
- **Verificación Instantánea**: Segundos vs días/semanas tradicionales
- **Inalterabilidad Práctica**: Pruebas criptográficas y evidencia auditable
- **Costo Mínimo**: Emisión y verificación a costo marginal
- **Auditoría Pública**: Transparencia verificable sin fricción
- **Experiencia Superior**: UI/UX futurista, precisa y clara

## 🛠️ Para audiencias técnicas (developers, CTOs)
### 🏗️ Arquitectura de Confianza
![Verificable](https://img.shields.io/badge/Credenciales-Verificables-blue) ![Auditable](https://img.shields.io/badge/Evidencia-Auditable-purple) ![Continuidad](https://img.shields.io/badge/Continuidad-Operativa-green) ![IPFS](https://img.shields.io/badge/IPFS-Distribuido-orange) ![Node.js](https://img.shields.io/badge/Node.js-Express-yellow) ![React](https://img.shields.io/badge/React-Vite-red)

### 🎨 Características Enterprise

#### 🔐 Seguridad Avanzada
- **Capas de Confianza**: Certificado principal + evidencia temporal + continuidad
- **Sharding Inteligente**: Partición por región/institución con balanceo
- **Failover Automático**: Conmutación transparente entre backends
- **Gobernanza**: Controles de acceso y trazabilidad de cambios

#### 📊 Dashboard Profesional
- **Admin Único**: Acceso restringido a SUPER_ADMIN_EMAIL
- **Paneles Multi-Rol**: Dashboards para admin/instituciones/estudiantes
- **Métricas en Tiempo Real**: Latencias, disponibilidad, actividad
- **Sistema de Planes**: Básico, Estándar, Premium, Enterprise

#### 🌐 Demo Público
- **Acceso Instantáneo**: Rutas `/demo/institution` y `/demo/student`
- **Tiempo Real**: Datos vivos con actualización automática
- **Agendamiento**: Calendly/Google Calendar integrados

#### 💼 Flujo Completo de Credenciales
- **Emisión Digital**: Certificados con metadatos verificables
- **Verificación Instantánea**: QR/URL con lectura pública
- **Gestión Masiva**: Emisión por lotes con validación automática
- **Exportación CSV**: Reportes con filtros avanzados

### 📈 Arquitectura Técnica
```
Frontend (React/Vite) ←→ Backend (Node.js/Express) ←→ Capas de Confianza
    │                            │                            │
    │                            ├── Credencial verificable   │
    │                            ├── Evidencia auditable      │
    │                            └── Continuidad operativa    │
    │                            │
    └── IPFS (Almacenamiento) ←──┘
```

## 🚀 Implementación Reciente

### 🎯 Continuidad Operativa
- **SDKs**: Integraciones nativas con proveedores de evidencia y continuidad
- **Data Mirroring**: Espejado de datos entre capas de confianza
- **Balanceo Inteligente**: Selección dinámica de backends

### 🏢 Dashboard de Planes Enterprise
- **Plan Básico**: 100 credenciales/mes
- **Plan Estándar**: 1,000 credenciales/mes
- **Plan Premium**: 10,000 credenciales/mes
- **Plan Enterprise**: Ilimitado, sharding + balanceo

### 🔧 API Unificada Inteligente
- **Single Endpoint**: API única con routing automático entre capas
- **Health Probes**: Monitoreo en tiempo real de servicios
- **Auto-Failover**: Conmutación transparente entre backends
- **Rate Limiting**: Limitación inteligente por plan/institución

## 🏁 Inicio Rápido (Paso a Paso Enterprise)

### 1️⃣ Prerrequisitos Técnicos
- Node.js 22.x LTS
- npm 10+
- Git
- Docker Desktop (recomendado para MongoDB, Redis)
- Wallets: HashPack (Hedera), XUMM (XRP), Pera (Algorand)

### 2️⃣ Clonar e Instalar
```bash
git clone <URL-DEL-REPOSITORIO>
cd AcademicChain-Ledger
npm install
```

### 3️⃣ Configuración Enterprise
Ejecuta el asistente de configuración:
```bash
node setup-env.js
```

#### Variables Críticas de Entorno
**En `server/.env`:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/academicchain
REDIS_URL=redis://localhost:6379

# Blockchain Networks
HEDERA_NETWORK=testnet|mainnet
HEDERA_ACCOUNT_ID=0.0.<ID>
HEDERA_PRIVATE_KEY=<CLAVE_PRIVADA>

XRPL_ENABLED=true|false
XRPL_NETWORK=testnet|mainnet  
XRPL_SEED=<SEED_WALLET>

ALGORAND_ENABLED=true|false
ALGORAND_NETWORK=testnet|mainnet
ALGORAND_ACCOUNT=<CUENTA>
ALGORAND_MNEMONIC=<MNEMONIC>

# Security
SUPER_ADMIN_EMAIL=admin@academicchain.io
JWT_SECRET=<SECRET_COMPLEJO>

# Demo System
DEMO_SCHEDULING=true
GOOGLE_CALENDAR_API_KEY=<API_KEY>
```

**En `client/.env.local`:**
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_ALLOW_OWNER=1
VITE_PREVIEW_OWNER_EMAIL=admin@academicchain.io
VITE_HEDERA_NETWORK=testnet
VITE_ALGORAND_NETWORK=testnet
```

### 4️⃣ Levantar Infraestructura
```bash
# Opción recomendada (Docker Compose)
docker compose -f docker-compose-services.yml up -d

# Opción alternativa
npm run docker:up
```

### 5️⃣ Ejecutar en Modo Desarrollo
```bash
npm run dev
```

**URLs de Desarrollo:**
- Frontend: `http://localhost:5174` (puerto variable)
- Backend: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`
- Readiness Probe: `http://localhost:3001/ready`

### 6️⃣ Acceso Demo Inmediato

#### 👨‍💻 Demo Institución
```bash
# Acceso directo al dashboard institucional demo
http://localhost:5174/demo/institution
```

#### 🎓 Demo Estudiante  
```bash
# Acceso directo al portal estudiantil demo
http://localhost:5174/demo/student
```

#### 🔐 Modo Admin Completo
```bash
# Login con credenciales de super admin
Email: admin@academicchain.io
Password: [configurado en .env]
```

## 🎯 Flujos de Demo Automáticos

### 🏫 Dashboard Institucional Demo (`/demo/institution`)
- **Emisión de Credenciales**: NFTs con metadata real
- **Gestión de Tokens**: Creación y administración de tokens académicos
- **Estadísticas en Tiempo Real**: Métricas de emisión y verificación
- **Exportación CSV**: Reportes completos de todas las credenciales
- **Verificación QR**: Generación de códigos QR para verificadores

### 🎓 Portal Estudiantil Demo (`/demo/student`)
- **Credenciales Recibidas**: Lista completa de NFTs académicos
- **Verificación Instantánea**: QR codes para compartir con empleadores
- **Documentos IPFS**: Acceso directo a documentos almacenados
- **Auto-Actualización**: Datos en tiempo real cada 10 segundos

### 📅 Sistema de Agendamiento (`/agenda`)
- **Integración Google Calendar**: Agendamiento automático de demos
- **Notificaciones**: Recordatorios por email y calendario
- **Multi-Timezone**: Soporte global para diferentes zonas horarias
- **CRM Integration**: Seguimiento automático de leads

## 🔧 Comandos de Verificación Enterprise

### Health Checks Completos
```powershell
# Health del sistema completo
Invoke-RestMethod -Uri 'http://localhost:3001/health' | ConvertTo-Json -Compress

# Readiness con verificación blockchain
Invoke-RestMethod -Uri 'http://localhost:3001/ready' | ConvertTo-Json -Compress

# Status de todas las redes blockchain
Invoke-RestMethod -Uri 'http://localhost:3001/api/blockchain/status' | ConvertTo-Json -Compress
```

### Emisión de Credenciales Demo
```powershell
# Login de super admin
$body = @{ email='admin@academicchain.io'; password='[PASSWORD]' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/auth/login' -ContentType 'application/json' -Body $body
$token = $login.token

# Emitir credencial demo
$issueBody = @{ 
    tokenId='0.0.123456';
    uniqueHash='DEMO-UNIQUE-001';
    ipfsURI='ipfs://QmDemoCredential';
    recipientAccountId='0.0.987654';
    title='Título Demo Ingeniería';
    issuer='Demo University'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/universities/issue-demo' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $issueBody
```

### Verificación Multi-Blockchain
```powershell
# Verificar credencial en todas las redes
$verifyBody = @{ 
    tokenId='0.0.123456';
    serialNumber='1'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/verify/multi' -ContentType 'application/json' -Body $verifyBody | ConvertTo-Json -Compress
```

## 📊 Métricas y Analytics

### Dashboard de Performance
- **Transacciones por Segundo**: Monitoréo en tiempo real
- **Costos por Emisión**: Comparativa entre blockchains
- **Tiempos de Verificación**: Promedios y percentiles
- **Uptime**: Disponibilidad de cada red blockchain

### Reportes Automáticos
- **Daily Reports**: Resumen diario de actividad
- **Monthly Analytics**: Análisis mensual de usage y costos
- **Institution Reports**: Reportes personalizados por institución
- **Exportación CSV/JSON**: Todos los datos exportables

## 🚀 Deployment en Producción

### Infraestructura Recomendada (Enero 2026)
- Backend: Google Cloud Run
- Bóveda de Llaves: Google Secret Manager
- Base de Datos: MongoDB Atlas Serverless
- Frontend: Vercel

#### Despliegue en Render (Serverless Production)
- Servicio:
  - Crea un Web Service apuntando al directorio `server/`
  - Build command: `npm ci`
  - Start command: `npm start`
  - Auto Deploy: activado
  - Puerto: usa `PORT` (la app ya lee `process.env.PORT`)
- Variables de Entorno (Render):
  - Esenciales:
    - `NODE_ENV=production`
    - `SERVER_URL=https://academicchain-ledger.onrender.com`
    - `CLIENT_URL=https://tu-frontend.vercel.app`
    - `JWT_SECRET=<un_secret_robusto>`
    - `MONGODB_URI=mongodb+srv://<usuario>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`
    - `REDIS_URL=redis://default:<PASSWORD>@redis-13743.c73.us-east-1-2.ec2.redns.redis-cloud.com:13743`
      - Si usas Redis Cloud, el usuario suele ser `default` y la contraseña es la de tu instancia
    - `HEDERA_NETWORK=testnet` | `mainnet`
    - `HEDERA_ACCOUNT_ID=0.0.<ID>`
    - `HEDERA_PRIVATE_KEY=<SECRETO>` (configúralo como Secret en Render)
    - `ACL_TOKEN_ID=0.0.<TOKEN_ACL>` (token de control de acceso requerido por associationGuard)
  - Opcionales/Recomendados:
    - `FRONTEND_URL=https://tu-frontend.vercel.app` (CORS)
    - `ALLOWED_VERIFIER_ORIGINS=https://tu-frontend.vercel.app`
    - `DEFAULT_UNIVERSITY_PLAN=basic`
    - `DISABLE_SWAGGER=1` (oculta documentación en producción)
    - `REQUIRE_API_KEY_FOR_VERIFICATION=1` (protege endpoints de verificación)
    - `ENABLE_XRP_ANCHOR=0|1` (anclajes XRPL; requiere `XRPL_ENABLED=true` y `XRPL_SEED`)
    - `XRPL_ENABLED=true|false`, `XRPL_NETWORK=testnet|mainnet`, `XRPL_SEED=<seed>` (como Secret)
    - `ALGORAND_ENABLED=true|false`, `ALGORAND_NETWORK=testnet|mainnet`, `ALGORAND_MNEMONIC=<mnemonic>` (Secret)
    - `HEDERA_MIRROR_URL=https://testnet.mirrornode.hedera.com` (o mainnet)
    - `ALLOW_V1_TOKEN_AUTO_CREATE=false` (dejar en false para producción)
    - `ACADEMIC_CHAIN_API_KEY=<opcional>` (si lo defines, los endpoints v1 requerirán header `X-API-Key` igual a este valor)
    - `DISABLE_MONGO=0`, `DISABLE_REDIS=0` (asegura que DB/Redis estén habilitados)
- Health Checks:
  - HTTP path `/health` y `/ready` para probes en Render
- CORS:
  - Usa `CLIENT_URL`/`FRONTEND_URL` con tu dominio público del frontend
- Notas:
  - Nunca publiques llaves privadas en el repositorio; usa Secrets de Render para claves sensibles
  - Si recibes `Token no asociado a institución`, vincula tu `ACL_TOKEN_ID` a la cuenta Hedera de la universidad antes de emitir

#### Despliegue en Koyeb (Alternativa Serverless)
- Servicio:
  - Crea una App y un Service desde tu repositorio.
  - Directorio de trabajo: `server/`
  - Build command: `npm ci && npm run build`
  - Start command: `npm start`
  - Puerto: usa `PORT` (la app ya lee `process.env.PORT`).
- Variables y Secretos (Koyeb ENV):
  - `NODE_ENV=production`
  - `CLIENT_URL=https://tu-dominio.vercel.app`
  - `MONGODB_URI=mongodb+srv://<usuario>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`
  - `HEDERA_NETWORK=testnet|mainnet`
  - `XRPL_NETWORK=testnet|mainnet`
  - `ALGORAND_NETWORK=testnet|mainnet`
  - `HEDERA_ACCOUNT_ID=0.0.<ID>`
  - `HEDERA_PRIVATE_KEY=<clave>` (como secreto)
  - `XRPL_SEED=<seed>` (secreto)
  - `ALGORAND_MNEMONIC=<mnemonic>` (secreto)
  - `PINATA_API_KEY`, `PINATA_SECRET_API_KEY` (secretos)
- Health Checks:
  - HTTP path `/health` y `/ready` para probes.
- Dominio y CORS:
  - Configura el dominio en Koyeb y usa ese URL en `CLIENT_URL` y `VITE_API_URL` del frontend.
- Notas:
  - La resolución de secretos en el código primero utiliza las variables de entorno; en Koyeb basta con definirlas como ENV/Secrets.

#### Pasos Rápidos
- Backend en Cloud Run:
  1. Configura variables sensibles en Secret Manager (ej. HEDERA_PRIVATE_KEY).
  2. Despliega el contenedor:
     ```bash
     gcloud run deploy academicchain-api \
       --source ./server \
       --region southamerica-west1 \
       --allow-unauthenticated \
       --set-env-vars NODE_ENV=production,CLIENT_URL=https://tu-dominio.vercel.app,MONGODB_URI='mongodb+srv://<atlas-uri>'
     ```
  3. Concede al servicio permiso para leer secretos (roles/secretmanager.secretAccessor).
- Base de Datos en Atlas Serverless:
  - Crea instancia Serverless y copia el URI (usar SRV).
- Frontend en Vercel:
  - Importa el proyecto de `client/` y configura env:
    - `VITE_API_URL=https://<cloud-run-url>`
    - `VITE_HEDERA_NETWORK=testnet|mainnet`
    - `VITE_ALGORAND_NETWORK=testnet|mainnet`
  - Deploy con un clic desde Vercel.

### Docker Enterprise
```dockerfile
# Docker Compose para producción
docker compose -f docker-compose.prod.yml up -d

# Verificar servicios
docker ps
docker logs academicchain-api
```

### Producción (Render) — Ejemplos de API

#### Flujo de Desarrollador (API Keys)
```powershell
# 1) Registrar desarrollador
$reg = Invoke-RestMethod -Method Post -Uri 'https://academicchain-ledger.onrender.com/api/v1/developers/register' -ContentType 'application/json' -Body (@{ email='dev@example.com'; name='Dev Test'; password='Password123!' } | ConvertTo-Json)
$tokenVerif = $reg.data.verificationToken

# 2) Verificar email
Invoke-RestMethod -Method Post -Uri 'https://academicchain-ledger.onrender.com/api/v1/developers/verify-email' -ContentType 'application/json' -Body (@{ token=$tokenVerif } | ConvertTo-Json)

# 3) Login y emitir API Key
$login = Invoke-RestMethod -Method Post -Uri 'https://academicchain-ledger.onrender.com/api/v1/developers/login' -ContentType 'application/json' -Body (@{ email='dev@example.com'; password='Password123!' } | ConvertTo-Json)
$jwt = $login.data.token
$apiKeyResp = Invoke-RestMethod -Method Post -Uri 'https://academicchain-ledger.onrender.com/api/v1/developers/api-keys/issue' -Headers @{ Authorization=("Bearer " + $jwt) } -ContentType 'application/json' -Body (@{ name='Prod Key' } | ConvertTo-Json)
$apiKey = $apiKeyResp.data.apiKey
```

#### Emisión Unificada (con `X-API-Key`)
```powershell
$issueBody = @{
  tokenId='0.0.<TU_TOKEN_ID_REAL>';   # Debe estar asociado a tu cuenta Hedera
  uniqueHash='SHA256-DEL-DOCUMENTO';
  ipfsURI='ipfs://<CID>';
  studentName='Nombre Estudiante';
  degree='Nombre del Programa';
  recipientAccountId='0.0.<CUENTA_ESTUDIANTE>'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'https://academicchain-ledger.onrender.com/api/v1/credentials/issue-unified' `
  -Headers @{ 'X-API-Key' = $apiKey } `
  -ContentType 'application/json' `
  -Body $issueBody | ConvertTo-Json -Depth 5
```

#### Verificación Forense
```powershell
Invoke-RestMethod -Method Get -Uri 'https://academicchain-ledger.onrender.com/api/v1/credentials/verify/<credentialId>' | ConvertTo-Json -Depth 5
```

## 🔗 Enlaces de Verificación

### Hedera Hashgraph
- **Testnet**: https://hashscan.io/testnet
- **Mainnet**: https://hashscan.io/mainnet
- **Token Explorer**: https://hashscan.io/testnet/token/{tokenId}

### XRP Ledger  
- **Testnet**: https://testnet.xrpl.org
- **Mainnet**: https://livenet.xrpl.org
- **Transaction Explorer**: https://testnet.xrpl.org/transactions/{txHash}

### Algorand
- **Testnet**: https://testnet.explorer.perawallet.app
- **Mainnet**: https://explorer.perawallet.app
- **Asset Explorer**: https://testnet.explorer.perawallet.app/asset/{assetId}

## 📞 Soporte y Contacto

### Soporte Técnico
- **Documentación Completa**: https://docs.academicchain.io
- **GitHub Issues**: https://github.com/academicchain/ledger/issues
- **Email Soporte**: support@academicchain.io

### Enterprise Sales
- **Demo Enterprise**: https://academicchain.io/demo
- **Contacto Ventas**: sales@academicchain.io
- **Precios Enterprise**: https://academicchain.io/pricing

---

## 🎯 Próximos Features (Roadmap Q1 2025)

### 🔄 Cross-Chain Swaps
- Intercambio automático entre Hedera-XRP-Algorand
- Liquidity pools para fees de transacción

### 🎓 Smart Credentials
- Credenciales programables con condiciones
- Auto-expiración y renovación automática

### 🌐 DeFi Integration
- Staking de credenciales académicas
- Tokenización de reputación académica

### 📊 Advanced Analytics
- Machine Learning para detección de fraudes
- Predictive analytics para tendencias educativas

---

**AcademicChain Ledger** - Transformando la educación con blockchain enterprise-grade. 🚀
