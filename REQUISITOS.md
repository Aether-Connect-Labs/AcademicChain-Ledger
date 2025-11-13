# 📋 Requisitos para AcademicChain Ledger

## ✅ Estado Actual de los Servicios

### Servicios Funcionando:
- ✅ **Servidor API** (Puerto 3001): ACTIVO y funcionando
- ✅ **Hedera Hashgraph**: CONFIGURADO (Network: testnet, Account: 0.0.7174400)
- ✅ **Pinata/IPFS**: CONECTADO Y FUNCIONANDO

### Servicios Faltantes:
- ❌ **MongoDB** (Puerto 27017): NO INSTALADO/CORRIENDO
- ❌ **Redis** (Puerto 6379): NO INSTALADO/CORRIENDO
- ⚠️ **Cliente Web** (Puerto 3000): Iniciando...

---

## 🔧 Lo que NECESITAS para que todo funcione

### 1. **MongoDB** (CRÍTICO - Base de datos)
**¿Por qué?** Guarda usuarios, credenciales, transacciones, universidades, etc.

**Opciones de instalación:**

#### Opción A: Usar Docker (RECOMENDADO - Más fácil)
```bash
# Iniciar MongoDB con Docker
docker run -d --name academicchain-mongo `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=academicchain2024 `
  -e MONGO_INITDB_DATABASE=academicchain `
  -v mongo-data:/data/db `
  mongo:latest
```

#### Opción B: Instalar MongoDB localmente
1. Descarga MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Instala y ejecuta el servicio
3. O usa MongoDB Atlas (nube): https://www.mongodb.com/cloud/atlas

**Credenciales configuradas en tu .env:**
- Usuario: `admin`
- Contraseña: `academicchain2024`
- Base de datos: `academicchain`

---

### 2. **Redis** (IMPORTANTE - Colas y caché)
**¿Por qué?** Sistema de colas (BullMQ) para procesar credenciales en segundo plano, caché de sesiones

**Opciones de instalación:**

#### Opción A: Usar Docker (RECOMENDADO)
```bash
# Iniciar Redis con Docker
docker run -d --name academicchain-redis `
  -p 6379:6379 `
  -e REDIS_PASSWORD=academicchain2024 `
  redis:latest redis-server --requirepass academicchain2024
```

#### Opción B: Instalar Redis localmente
1. Windows: Descarga desde https://github.com/microsoftarchive/redis/releases
2. O usa Redis Cloud (gratis): https://redis.com/try-free/

**Credenciales configuradas en tu .env:**
- URL: `redis://:academicchain2024@localhost:6379`

---

### 3. **Servicios Opcionales (Ya configurados)**
- ✅ **Hedera Hashgraph**: Ya configurado con tu cuenta
- ✅ **Pinata/IPFS**: Ya configurado y funcionando

---

## 🚀 Solución Rápida: Usar Docker Compose

Si tienes Docker instalado, puedes iniciar MongoDB y Redis con un solo comando:

```bash
# Iniciar servicios con Docker Compose (nota el espacio en 'docker compose')
docker compose -f docker-compose-services.yml up -d
```

O manualmente:
```bash
# MongoDB
docker run -d --name academicchain-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=academicchain2024 mongo:latest

# Redis
docker run -d --name academicchain-redis -p 6379:6379 redis:latest
```

---

## 📝 Resumen de Configuración

Tu archivo `server/.env` ya tiene:
- ✅ JWT_SECRET configurado
- ✅ HEDERA_ACCOUNT_ID: 0.0.7174400
- ✅ HEDERA_PRIVATE_KEY configurada
- ✅ PINATA_API_KEY y PINATA_SECRET_API_KEY configurados
- ✅ MONGODB_URI esperando en localhost:27017
- ✅ REDIS_URL esperando en localhost:6379

**Solo necesitas:**
1. Instalar/levantar MongoDB
2. Instalar/levantar Redis
3. Reiniciar el servidor

---

## 🧪 Verificación

Después de instalar los servicios, ejecuta:
```bash
node check-services.js
```

Deberías ver:
- ✅ MongoDB: CONECTADO
- ✅ Redis: CONECTADO
- ✅ Servidor API: ACTIVO
- ✅ Cliente Web: ACTIVO

---

## ⚠️ Nota Importante

**El servidor puede funcionar SIN MongoDB y Redis**, pero con limitaciones:
- ❌ No podrás guardar usuarios ni credenciales
- ❌ No funcionarán las colas de procesamiento
- ❌ No habrá caché de sesiones
- ✅ La API básica funcionará
- ✅ Las rutas públicas funcionarán

Para pruebas completas, **necesitas MongoDB y Redis**.
