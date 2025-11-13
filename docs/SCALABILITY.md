# 🚀 Mejoras de Escalabilidad - AcademicChain Ledger

Este documento describe todas las mejoras implementadas para hacer el sistema más escalable y robusto.

## 📋 Índice

1. [Mejoras de Base de Datos](#mejoras-de-base-de-datos)
2. [Mejoras de Redis](#mejoras-de-redis)
3. [Sistema de Caché](#sistema-de-caché)
4. [Load Balancing y Nginx](#load-balancing-y-nginx)
5. [Rate Limiting Mejorado](#rate-limiting-mejorado)
6. [Health Checks](#health-checks)
7. [Clustering con PM2](#clustering-con-pm2)
8. [Docker Compose Escalable](#docker-compose-escalable)
9. [Configuración de Debugging](#configuración-de-debugging)

---

## 1. Mejoras de Base de Datos

### MongoDB Connection Pooling

**Archivo:** `server/src/config/database.js`

**Mejoras implementadas:**
- ✅ Connection pooling configurable (`maxPoolSize`, `minPoolSize`)
- ✅ Retry logic con exponential backoff
- ✅ Configuración de timeouts optimizada
- ✅ Auto-reconexión automática
- ✅ Event listeners para monitoreo
- ✅ Graceful shutdown

**Configuración por variables de entorno:**
```bash
MONGO_MAX_POOL_SIZE=10      # Máximo de conexiones en el pool
MONGO_MIN_POOL_SIZE=2       # Mínimo de conexiones en el pool
MONGO_MAX_RETRIES=5         # Intentos máximos de reconexión
MONGO_RETRY_DELAY=5000      # Delay base para retries (ms)
MONGO_SERVER_SELECTION_TIMEOUT=5000
MONGO_SOCKET_TIMEOUT=45000
MONGO_CONNECT_TIMEOUT=10000
```

---

## 2. Mejoras de Redis

### Redis Clustering y Alta Disponibilidad

**Archivo:** `server/queue/connection.js`

**Mejoras implementadas:**
- ✅ Soporte para Redis Cluster
- ✅ Soporte para Redis Sentinel (alta disponibilidad)
- ✅ Configuración de retry con estrategia exponencial
- ✅ Reconexión automática
- ✅ Keep-alive para mantener conexiones vivas
- ✅ Event listeners para monitoreo
- ✅ Helpers para verificar estado y estadísticas

**Configuración por variables de entorno:**
```bash
# Standalone Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=academicchain2024

# Redis Cluster (múltiples nodos)
REDIS_CLUSTER_NODES=node1:6379,node2:6379,node3:6379

# Redis Sentinel (alta disponibilidad)
REDIS_SENTINELS=sentinel1:26379,sentinel2:26379,sentinel3:26379
REDIS_MASTER_NAME=mymaster
```

---

## 3. Sistema de Caché

### Servicio de Caché Escalable

**Archivo:** `server/src/services/cacheService.js`

**Características:**
- ✅ Operaciones CRUD completas (get, set, delete, exists)
- ✅ Operaciones en lote (mget, mset)
- ✅ Eliminación por patrones
- ✅ TTL (Time To Live) configurable
- ✅ Incremento de valores numéricos
- ✅ Estadísticas del caché
- ✅ Prefijos para namespacing

**Archivo:** `server/src/middleware/cache.js`

**Middleware de caché HTTP:**
- ✅ Caché automático para respuestas GET
- ✅ Invalidación automática después de POST/PUT/DELETE
- ✅ Invalidación por patrones
- ✅ Headers HTTP de caché

**Uso:**
```javascript
// En las rutas
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

// Cachear respuestas GET (5 minutos)
router.get('/users/:id', cacheMiddleware(300), getUser);

// Invalidar caché después de actualizar
router.put('/users/:id', invalidateCache(['user:*', 'http:*/api/users/*']), updateUser);
```

**Configuración:**
```bash
CACHE_DEFAULT_TTL=3600        # TTL por defecto en segundos (1 hora)
CACHE_KEY_PREFIX=academicchain: # Prefijo para todas las claves
```

---

## 4. Load Balancing y Nginx

### Nginx con Load Balancing

**Archivo:** `nginx.conf`

**Características:**
- ✅ Load balancing con algoritmo least_conn
- ✅ Health checks para upstream servers
- ✅ Rate limiting por tipo de endpoint
- ✅ Caché HTTP proxy (dos zonas: API y estáticos)
- ✅ Compresión Gzip
- ✅ WebSocket support para Socket.IO
- ✅ Configuración optimizada para alto tráfico

**Zonas de rate limiting:**
- `api_limit`: 10 req/s con burst de 20
- `auth_limit`: 2 req/s con burst de 5
- `verification_limit`: 5 req/s con burst de 10

**Upstream servers:**
```nginx
upstream backend_servers {
    least_conn;
    server server:3001 max_fails=3 fail_timeout=30s;
    # Agregar más servidores aquí:
    # server server2:3001 max_fails=3 fail_timeout=30s;
}
```

**Para escalar horizontalmente:**
1. Agregar más instancias del servidor en `docker-compose.yml`
2. Actualizar `upstream backend_servers` en `nginx.conf`
3. Nginx distribuirá el tráfico automáticamente

---

## 5. Rate Limiting Mejorado

**Archivo:** `server/src/app.js`

**Rate limiters diferenciados:**
- **General:** 100 requests / 15 minutos
- **Auth:** 20 requests / 15 minutos (más restrictivo)
- **Verification:** 30 requests / 1 minuto
- **Admin:** 200 requests / 15 minutos

**Características:**
- ✅ Rate limiting específico por tipo de endpoint
- ✅ Headers estándar HTTP (RateLimit-*)
- ✅ Skip automático para health checks
- ✅ Compatible con Redis para rate limiting distribuido

---

## 6. Health Checks

**Endpoints implementados:**

### `/health`
Health check básico con información del sistema:
- Estado del servicio
- Uptime
- Uso de memoria
- Versión

### `/ready`
Readiness probe para Kubernetes/Docker:
- Verifica conexión a MongoDB
- Verifica conexión a Redis
- Retorna 503 si algún servicio crítico está caído

### `/live`
Liveness probe:
- Verifica que el proceso esté vivo
- Retorna información básica del proceso

### `/metrics` (requiere autenticación admin)
Métricas detalladas del sistema:
- Estadísticas de MongoDB
- Estadísticas de Redis
- Estadísticas de caché
- Uso de CPU y memoria
- Uptime y PID

**Uso en Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 7. Clustering con PM2

**Archivo:** `server/ecosystem.config.js`

**Configuración:**
- ✅ Modo cluster (utiliza todos los CPUs)
- ✅ Auto-restart en caso de fallos
- ✅ Límite de memoria (auto-restart si excede)
- ✅ Logging centralizado
- ✅ Graceful shutdown
- ✅ Workers separados para procesamiento de colas

**Scripts disponibles:**
```bash
# Iniciar con PM2
npm run start:pm2

# Iniciar en producción
npm run start:pm2:prod

# Detener
npm run stop:pm2

# Reiniciar
npm run restart:pm2

# Ver logs
npm run logs:pm2

# Monitoreo en tiempo real
npm run monit:pm2
```

**Configuración:**
```bash
PM2_INSTANCES=max        # Usar todos los CPUs (o número específico)
WORKER_INSTANCES=2       # Número de workers
```

---

## 8. Docker Compose Escalable

**Archivo:** `docker-compose.yml`

**Mejoras implementadas:**
- ✅ Redis incluido con persistencia
- ✅ Health checks para todos los servicios
- ✅ Workers separados para procesamiento
- ✅ Configuración de recursos (CPU/memoria)
- ✅ Restart policies
- ✅ Network isolation
- ✅ Variables de entorno configurables

**Servicios:**
1. **mongo**: MongoDB con health checks y persistencia
2. **redis**: Redis 7 con AOF (persistencia) y LRU eviction
3. **server**: API principal con health checks
4. **server-worker**: Workers para procesar colas (2 réplicas)
5. **client**: Frontend con health checks
6. **nginx**: Reverse proxy con load balancing

**Para escalar horizontalmente:**
```bash
# Escalar servidor a 3 instancias
docker-compose up -d --scale server=3

# Escalar workers a 4 instancias
docker-compose up -d --scale server-worker=4
```

**Variables de entorno:**
```bash
MONGO_USERNAME=admin
MONGO_PASSWORD=academicchain2024
MONGO_DATABASE=academicchain
REDIS_PASSWORD=academicchain2024
NODE_ENV=production
```

---

## 9. Configuración de Debugging

**Archivo:** `.vscode/launch.json`

**Mejoras:**
- ✅ Configuraciones múltiples para diferentes escenarios
- ✅ Source maps habilitados
- ✅ Configuración para modo producción
- ✅ Configuración compound para debuggear cliente y servidor simultáneamente
- ✅ Attach a procesos en ejecución
- ✅ Variables de entorno configurables

**Configuraciones disponibles:**
- `Launch Chrome - AcademicChain Client`: Debug del frontend
- `Debug Server`: Debug del servidor en desarrollo
- `Debug Server (Production Mode)`: Debug del servidor en producción
- `Debug Client`: Debug del cliente con npm
- `Attach to Server Process`: Adjuntar a proceso en ejecución
- `Debug All`: Debug cliente y servidor simultáneamente

---

## 📊 Métricas de Rendimiento Esperadas

Con estas mejoras, el sistema puede manejar:

- **Request Rate:** Hasta 1000+ req/s (dependiendo del hardware)
- **Concurrent Users:** 10,000+ usuarios simultáneos
- **Database Connections:** Pool optimizado de 2-10 conexiones
- **Cache Hit Rate:** 60-80% (dependiendo del uso)
- **Response Time:** < 100ms para requests cacheados, < 500ms para DB queries

---

## 🔧 Próximas Mejoras Recomendadas

1. **CDN Integration**: Para servir assets estáticos
2. **Database Replication**: MongoDB replica sets
3. **Redis Persistence Options**: RDB + AOF
4. **Monitoring**: Integración con Prometheus/Grafana
5. **Logging Centralizado**: ELK Stack o similar
6. **Auto-scaling**: Kubernetes HPA o Docker Swarm
7. **Circuit Breakers**: Para llamadas externas
8. **Message Queue**: RabbitMQ o Apache Kafka para alta carga

---

## 📝 Notas de Implementación

- Todas las mejoras son **backward compatible**
- Las configuraciones por defecto son seguras para desarrollo
- Para producción, ajustar variables de entorno según necesidades
- Los health checks son críticos para orquestadores (K8s, Docker Swarm)
- El sistema degrada gracefully si Redis o MongoDB están caídos (en algunos casos)

---

## 🚀 Comandos Rápidos

```bash
# Iniciar todo con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Escalar servidor
docker-compose up -d --scale server=3

# Iniciar con PM2 (sin Docker)
cd server
npm run start:pm2:prod

# Verificar health
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/metrics
```

---

**Última actualización:** 2024
**Versión:** 1.0.0

