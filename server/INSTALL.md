# 🚀 AcademicChain Ledger - Guía de Instalación

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **npm** o **yarn**
- **Git**
- Cuenta en [Hedera Portal](https://portal.hedera.com/) (para testnet)

## 🛠️ Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/academicchain-ledger.git
cd academicchain-ledger
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del workspace principal
npm install

# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install

# Volver al directorio raíz
cd ..
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables de entorno
nano .env
```

**Configuración mínima requerida:**

```env
# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Server Configuration
PORT=3001
JWT_SECRET=tu-super-secret-jwt-key-cambia-esto-en-produccion

# Base URL
BASE_URL=http://localhost:3001
```

### 4. Configurar Hedera

#### Opción A: Usar Cuenta Existente

1. Ve a [Hedera Portal](https://portal.hedera.com/)
2. Crea una cuenta de testnet
3. Copia el Account ID y Private Key
4. Actualiza tu archivo `.env`

#### Opción B: Generar Nueva Cuenta

```bash
# Generar nueva clave privada
cd server
node scripts/setup-hedera.js generate

# Crear cuenta en Hedera Portal con la clave pública generada
# Luego actualizar .env con el Account ID
```

### 5. Verificar Configuración

```bash
# Verificar conexión con Hedera
cd server
node scripts/setup-hedera.js status

# Deberías ver algo como:
# ✅ Network is operational
#    Network: testnet
#    Account: 0.0.123456
#    Balance: 100 ℏ
```

### 6. Ejecutar el Sistema

#### Desarrollo (Recomendado)

```bash
# Ejecutar servidor y cliente en paralelo
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

#### Producción

```bash
# Construir cliente
cd client
npm run build

# Iniciar servidor
cd ../server
npm start
```

## 🧪 Probar el Sistema

### 1. Verificar API

```bash
# Health check
curl http://localhost:3001/health

# Deberías recibir:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "AcademicChain Ledger API",
  "version": "1.0.0"
}
```

### 2. Ejecutar Demo

```bash
# Ejecutar demo completo
cd server
node scripts/demo.js run
```

El demo creará:
- 1 token académico
- 3 credenciales NFT
- QR codes para verificación
- Verificaciones de credenciales

### 3. Probar Verificación

1. Ve a http://localhost:3000
2. Escanea uno de los QR codes generados
3. Verifica que la credencial sea válida

## 📱 Uso del Sistema

### Para Universidades

1. **Registrarse**: Crear cuenta en el portal
2. **Crear Token**: Emitir token para la universidad
3. **Mintear Credenciales**: Crear NFTs para graduados
4. **Generar QR**: Crear códigos QR para verificación

### Para Empresas

1. **Escanear QR**: Usar la app móvil o web
2. **Verificar**: Consultar validez en Hedera
3. **Recibir Resultado**: Confirmación instantánea

### Para Graduados

1. **Recibir NFT**: Título tokenizado en wallet
2. **Compartir QR**: Mostrar a empleadores
3. **Actualizar**: Agregar nuevas certificaciones

## 🔧 Configuración Avanzada

### Base de Datos (Opcional)

```env
# MongoDB
DATABASE_URL=mongodb://localhost:27017/academicchain-ledger

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/academicchain-ledger
```

### Email (Opcional)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Monitoreo (Opcional)

```env
SENTRY_DSN=tu-sentry-dsn
NEW_RELIC_LICENSE_KEY=tu-new-relic-key
```

## 🚨 Solución de Problemas

### Error: "Failed to initialize Hedera client"

1. Verifica que `HEDERA_ACCOUNT_ID` y `HEDERA_PRIVATE_KEY` estén correctos
2. Asegúrate de que la cuenta tenga suficiente HBAR
3. Verifica la conectividad a internet

### Error: "Token expired"

1. Regenera el JWT secret en `.env`
2. Reinicia el servidor

### Error: "Port already in use"

```bash
# Cambiar puerto en .env
PORT=3002

# O matar proceso que usa el puerto
lsof -ti:3001 | xargs kill -9
```

### Error: "Module not found"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📊 Monitoreo y Logs

### Ver Logs del Servidor

```bash
# Logs en tiempo real
cd server
npm run dev

# Logs guardados
tail -f logs/combined.log
tail -f logs/error.log
```

### Métricas del Sistema

```bash
# Estado de la API
curl http://localhost:3001/api/verification/status

# Balance de Hedera
curl http://localhost:3001/api/nft/balance/0.0.123456
```

## 🔒 Seguridad

### Producción

1. **Cambiar JWT_SECRET**: Usa una clave fuerte y única
2. **HTTPS**: Configura SSL/TLS
3. **Rate Limiting**: Ajusta límites según necesidades
4. **CORS**: Configura orígenes permitidos
5. **Environment**: Usa variables de entorno seguras

### Variables Críticas

```env
# Cambiar en producción
JWT_SECRET=clave-super-secreta-y-unica
HEDERA_NETWORK=mainnet
NODE_ENV=production
```

## 📚 Recursos Adicionales

- [Documentación de Hedera](https://docs.hedera.com/)
- [Hedera Portal](https://portal.hedera.com/)
- [HashPack Wallet](https://hashpack.app/)
- [Hedera Explorer](https://hashscan.io/)

## 🤝 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/academicchain-ledger/issues)
- **Discord**: [AcademicChain Ledger Community](https://discord.gg/academicchain-ledger)
- **Email**: support@academicchain-ledger.com

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para detalles.

---

**¡Listo para revolucionar la verificación académica! 🎓🚀** 