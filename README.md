# 🎓 AcademicChain Ledger - Plataforma Blockchain para Credenciales Académicas

## 🚀 Propuesta de Valor
Solución end-to-end enterprise-grade para emisión y verificación de credenciales académicas en blockchain. Combina la velocidad y bajo costo de Hedera con la seguridad de XRP y la resiliencia de Algorand para ofrecer verificación instantánea con triple capa de seguridad.

## 🏆 Para audiencias ejecutivas (inversores, clientes)
### 📊 Problema del Mercado
Las credenciales académicas falsas cuestan $600+ mil millones anuales globalmente; la verificación manual consume 5-15 días por credencial con costos de $30-100 USD cada una.

### 💡 Solución Innovadora
Plataforma blockchain que transforma títulos universitarios en certificados digitales inalterables con verificación instantánea y triple respaldo blockchain.

### ⚡ Flujo de Valor
1. **Emisión Institucional**: Universidades autorizadas emiten títulos como NFTs con metadatos inmutables
2. **Recepción Estudiantil**: Estudiantes reciben QR/URL vinculado a su credencial blockchain
3. **Verificación Employers**: Cualquier empleador verifica autenticidad en segundos escaneando QR

### 🎯 Ventajas Competitivas Clave
- **Verificación Instantánea**: Segundos vs días/semanas tradicionales
- **Imposible de Falsificar**: Tecnología blockchain con triple respaldo
- **Costo Mínimo**: < $0.01 por emisión vs $30-100 tradicionales
- **Auditoría Pública**: Transparencia completa con triple ledger
- **Experencia Sin Fricción**: UI/UX intuitiva para todos los usuarios

## 🛠️ Para audiencias técnicas (developers, CTOs)
### 🏗️ Arquitectura Multi-Blockchain
![Hedera](https://img.shields.io/badge/Hedera-Hashgraph-blue) ![XRP](https://img.shields.io/badge/XRP-Ledger-purple) ![Algorand](https://img.shields.io/badge/Algorand-SDK-green) ![IPFS](https://img.shields.io/badge/IPFS-Descentralizado-orange) ![Node.js](https://img.shields.io/badge/Node.js-Express-yellow) ![React](https://img.shields.io/badge/React-Vite-red)

### 🎨 Características Enterprise

#### 🔐 Seguridad Avanzada
- **Triple-Layer Blockchain**: Hedera (NFTs) + XRP (auditoría) + Algorand (resiliencia)
- **Sharding Inteligente**: Partición por región/institución con balanceo round-robin
- **Failover Automático**: Conmutación automática entre redes blockchain
- **DAO Governance**: Sistema de gobernanza descentralizada con votación

#### 📊 Dashboard Profesional
- **Admin Único**: Acceso restringido a SUPER_ADMIN_EMAIL
- **Paneles Multi-Rol**: Dashboards diferenciados para admin/instituciones/estudiantes
- **Métricas en Tiempo Real**: Analytics de costos, transacciones y ahorros
- **Sistema de Planes**: Básico, Estándar, Premium, Enterprise con features progresivos

#### 🌐 Demo Público
- **Acceso Instantáneo**: Rutas `/demo/institution` y `/demo/student`
- **Datos Reales**: Credenciales demo con metadata completa
- **Auto-Actualización**: Datos en tiempo real cada 10 segundos
- **Agendamiento**: Sistema de citas integrado con Google Calendar

#### 💼 Flujo Completo de Credenciales
- **Emisión Tokenizada**: Conversión a NFTs con metadatos HIP‑412
- **Verificación Dual**: Validación on-chain vía QR/URL consultando múltiples ledgers
- **Gestión Masiva**: Emisión por lotes vía Excel con validación automática
- **Exportación CSV**: Reportes completos con filtros avanzados

### 📈 Arquitectura Técnica
```
Frontend (React/Vite) ←→ Backend (Node.js/Express) ←→ Triple Blockchain Layer
    │                            │                            │
    │                            ├── Hedera Hashgraph (NFTs)  │
    │                            ├── XRP Ledger (Auditoría)   │
    │                            └── Algorand (Resiliencia)   │
    │                            │
    └── IPFS (Almacenamiento) ←──┘
```

## 🚀 Implementación Reciente - Triple Capa Blockchain

### 🎯 Integración Algorand Completa
- **Algorand SDK**: Integración nativa con wallets y smart contracts
- **Node Validator**: Nodo completo para transacciones rápidas
- **Data Mirroring**: Espejado de datos entre Hedera-XRP-Algorand
- **Cross-Chain**: Balanceo inteligente entre redes blockchain

### 🏢 Dashboard de Planes Enterprise
- **Plan Básico**: 100 credenciales/mes, Hedera-only
- **Plan Estándar**: 1,000 credenciales/mes, Hedera + XRP  
- **Plan Premium**: 10,000 credenciales/mes, Triple-layer con Algorand
- **Plan Enterprise**: Unlimited, Sharding + Load Balancing + DAO

### 🔧 API Unificada Inteligente
- **Single Endpoint**: API única con routing automático entre blockchains
- **Health Probes**: Monitoreo en tiempo real de todas las redes
- **Auto-Failover**: Conmutación transparente entre ledgers
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

### Render.com (Recomendado)
```bash
# Variables de producción críticas
API_URL=https://academicchain-ledger.onrender.com
CLIENT_URL=https://academicchain.io

# Health checks de producción
curl -s https://academicchain-ledger.onrender.com/health
curl -s https://academicchain-ledger.onrender.com/ready
```

### Docker Enterprise
```dockerfile
# Docker Compose para producción
docker compose -f docker-compose.prod.yml up -d

# Verificar servicios
docker ps
docker logs academicchain-api
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
- **Testnet**: https://testnet.algoexplorer.io
- **Mainnet**: https://algoexplorer.io
- **Asset Explorer**: https://testnet.algoexplorer.io/asset/{assetId}

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