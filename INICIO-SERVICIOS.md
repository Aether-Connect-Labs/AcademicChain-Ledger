# 🚀 Guía para Iniciar Servicios de AcademicChain

## ⚠️ Estado Actual

**Docker Desktop NO está corriendo** o hay un problema con la API de Docker.

---

## 📋 Resumen: Lo que necesitas para que TODO funcione

### ✅ Ya Tienes Configurado:
- ✅ **Servidor API**: Corriendo en puerto 3001
- ✅ **Hedera Hashgraph**: Configurado (Account: 0.0.7174400)
- ✅ **Pinata/IPFS**: Configurado y funcionando
- ✅ **Variables de entorno**: Todas configuradas en `server/.env`

### ❌ Lo que FALTA:
- ❌ **MongoDB** (Puerto 27017): Base de datos principal
- ❌ **Redis** (Puerto 6379): Sistema de colas y caché

---

## 🔧 Solución 1: Usar Docker (RECOMENDADO)

### Paso 1: Iniciar Docker Desktop
1. Abre **Docker Desktop** en Windows
2. Espera a que inicie completamente (icono en la barra de tareas)

### Paso 2: Iniciar MongoDB y Redis
```bash
# Desde la raíz del proyecto (nota el espacio en 'docker compose')
docker compose -f docker-compose-services.yml up -d
```

### Paso 3: Verificar que estén corriendo
```bash
docker ps
```

Deberías ver dos contenedores:
- `academicchain-mongodb`
- `academicchain-redis`

---

## 🔧 Solución 2: Instalar Servicios Manualmente

### MongoDB

#### Opción A: Instalación Local (Windows)
1. Descarga: https://www.mongodb.com/try/download/community
2. Instala MongoDB Community Server
3. Inicia el servicio desde Services (Win + R → services.msc)

#### Opción B: MongoDB Atlas (Nube - GRATIS)
1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un cluster (gratis M0)
4. Obtén la connection string
5. Actualiza `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/academicchain
   ```

### Redis

#### Opción A: Instalación Local (Windows)
1. Descarga: https://github.com/microsoftarchive/redis/releases
2. O usa WSL2 con Redis:
   ```bash
   wsl --install
   # Luego en WSL:
   sudo apt update
   sudo apt install redis-server
   redis-server
   ```

#### Opción B: Redis Cloud (Nube - GRATIS)
1. Ve a: https://redis.com/try-free/
2. Crea una cuenta gratuita
3. Crea una base de datos
4. Obtén la connection string
5. Actualiza `server/.env`:
   ```
   REDIS_URL=redis://default:password@redis-cloud-url:port
   ```

---

## 🧪 Verificar Todo

Una vez que tengas MongoDB y Redis corriendo, ejecuta:

```bash
node check-services.js
```

Deberías ver:
```
✅ MongoDB: CONECTADO
✅ Redis: CONECTADO
✅ Servidor API: ACTIVO
✅ Hedera: CONFIGURADO
✅ Pinata: CONECTADO
```

---

## 📝 Configuración Actual en server/.env

Tu archivo ya tiene:
- ✅ `MONGODB_URI=mongodb://admin:academicchain2024@localhost:27017/academicchain?authSource=admin`
- ✅ `REDIS_URL=redis://:academicchain2024@localhost:6379`
- ✅ `HEDERA_ACCOUNT_ID=0.0.7174400`
- ✅ `HEDERA_PRIVATE_KEY=0x4673c75820049d694ef09d40d832a4a6598ec3fd58995ed0a76d855221dc0d57`
- ✅ `PINATA_API_KEY` y `PINATA_SECRET_API_KEY`

**Solo necesitas que MongoDB y Redis estén corriendo en los puertos correctos.**

---

## 🎯 Próximos Pasos

1. **Inicia Docker Desktop** (si quieres usar Docker)
   - O instala MongoDB y Redis manualmente
   - O usa servicios en la nube (MongoDB Atlas + Redis Cloud)

2. **Inicia los servicios** (MongoDB y Redis)

3. **Reinicia el servidor**:
   ```bash
   # Detén el servidor actual (Ctrl+C)
   npm run dev
   ```

4. **Verifica**:
   ```bash
   node check-services.js
   ```

5. **Prueba el proyecto**:
   - API: http://localhost:3001/health
   - Cliente: http://localhost:3000
   - API Docs: http://localhost:3001/api/docs

---

## 🆘 Si Tienes Problemas

### MongoDB no conecta:
- Verifica que el servicio esté corriendo: `netstat -an | findstr 27017`
- Verifica usuario/contraseña en `.env`
- Prueba con MongoDB Compass (GUI)

### Redis no conecta:
- Verifica que Redis esté corriendo: `netstat -an | findstr 6379`
- Prueba: `redis-cli ping` (si está instalado localmente)

### Servidor no inicia:
- Revisa los logs en la consola
- Verifica que los puertos 3000 y 3001 no estén ocupados
- Ejecuta `node check-services.js` para diagnóstico

---

## 📊 Funcionalidades por Servicio

| Servicio | ¿Necesario? | Para qué se usa |
|----------|-------------|-----------------|
| **MongoDB** | ✅ CRÍTICO | Guardar usuarios, credenciales, transacciones |
| **Redis** | ⚠️ IMPORTANTE | Colas de procesamiento, caché, sesiones |
| **Hedera** | ⚠️ IMPORTANTE | Blockchain (NFTs de credenciales) |
| **Pinata** | ⚠️ IMPORTANTE | Almacenar metadatos en IPFS |
| **Servidor** | ✅ CRÍTICO | API REST |
| **Cliente** | ✅ CRÍTICO | Interfaz web |

**Sin MongoDB**: No podrás guardar datos persistentes
**Sin Redis**: No funcionarán las colas de procesamiento (pero funcionará lo básico)
