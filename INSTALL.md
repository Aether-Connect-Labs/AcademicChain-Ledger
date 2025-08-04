# 🚀 AcademicChain Ledger - Guía de Instalación

Esta guía te ayudará a configurar y ejecutar el proyecto AcademicChain Ledger en tu entorno local.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

-   **Node.js**: Versión 18 o superior.
-   **npm**: Versión 8 o superior.
-   **Git**: Para clonar el repositorio.
-   **Docker y Docker Compose**: Para la configuración recomendada y más sencilla.
-   **Cuentas**: Una cuenta en [Hedera Portal](https://portal.hedera.com/) (testnet) y [Pinata](https://pinata.cloud) (plan gratuito).

## 🛠️ Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/academicchain-ledger.git
cd academicchain-ledger
```

### 2. Instalar Dependencias

```bash
# Dado que este es un "monorepo" que utiliza npm workspaces,
# puedes instalar todas las dependencias para el proyecto raíz,
# el servidor, el cliente y los contratos con un solo comando
# desde el directorio raíz del proyecto.
npm install
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
HEDERA_ACCOUNT_ID=0.0.6456952
HEDERA_PRIVATE_KEY=3030020100300706052b8104000a04220420e7aa18c891824d1df410fba0aa21ab279b42457dad18e4bd71b803f4afd5beaa

# IPFS Pinning Service (Pinata)
# Obtén tus claves en https://app.pinata.cloud/keys
PINATA_API_KEY=aa16ddac1302547ff8b2
PINATA_SECRET_API_KEY=0cc5191cbffb8154786fb578742f219c4c13acadff0fb27968070fe271b92da5

# Server Configuration
PORT=3001
JWT_SECRET=09dcd7c889101750ee273d688c9093ca56f7049a48ac8c8fae9fe8b588dd152a

# Base URL
BASE_URL=http://localhost:3001

# Database (MongoDB is required for the application to run)
DATABASE_URL=mongodb+srv://AcademicChain-Labs:YOJjLhE26SVEQxFU@cluster0.pcezczx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# (Opcional) Tu Token Fungible Personalizado para Pagos de Servicios
# Si se define, se cobrará una tarifa en este token por ciertas acciones (ej. emitir credenciales)
PAYMENT_TOKEN_ID=
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
#    Account: TU_ACCOUNT_ID
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
curl http://localhost:3001/api/verification/status

# Deberías recibir una respuesta JSON con el estado del servicio
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
2. Escanea uno de los QR codes generados en la terminal
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

1. Verifica que `HEDERA_ACCOUNT_ID` y `HEDERA_PRIVATE_KEY` estén correctos en tu archivo `.env`.
2. Asegúrate de que la cuenta tenga suficiente HBAR para realizar transacciones.
3. Verifica tu conexión a internet.

### Error: "Token expired" o "Invalid token"

1. Asegúrate de que el `JWT_SECRET` en tu archivo `.env` sea una cadena segura y única.
2. Reinicia el servidor después de cambiar el `JWT_SECRET`.

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
curl http://localhost:3001/api/nft/balance/TU_ACCOUNT_ID
```

## 🔒 Seguridad

### Producción

1.  **Cambiar JWT_SECRET**: Usa una clave criptográficamente segura.
    -   Puedes generar una fácilmente con este comando en tu terminal y copiar el resultado en tu archivo `.env`:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
2.  **HTTPS**: Configura un proxy inverso (como Nginx o Caddy) con un certificado SSL/TLS para encriptar el tráfico.
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