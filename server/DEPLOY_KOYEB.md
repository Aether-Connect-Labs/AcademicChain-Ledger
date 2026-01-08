# Guía de Despliegue en Koyeb (Backend)

Sigue estos pasos para desplegar tu servidor Node.js en Koyeb.

## Deploy Automático (Buildpack, sin Docker)

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=academicchain-ledger&type=git&repository=Aether-Connect-Labs%2FAcademicChain-Ledger&branch=main&workdir=server&build_command=npm+install+%26%26+npm+run+build&run_command=npm+start&regions=was&env%5BNODE_ENV%5D=production&env%5BPORT%5D=3001&env%5BCLIENT_URL%5D=https%3A%2F%2Facademic-chain-ledger.vercel.app&ports=3001%3Bhttp%3B%2F&hc_protocol%5B3001%5D=http&hc_grace_period%5B3001%5D=5&hc_interval%5B3001%5D=30&hc_restart_limit%5B3001%5D=3&hc_timeout%5B3001%5D=5&hc_path%5B3001%5D=%2Fhealth&hc_method%5B3001%5D=get)

Variables que debes agregar como secretos en Koyeb después de pulsar el botón:
- MONGODB_URI
- JWT_SECRET
- PINATA_API_KEY, PINATA_SECRET_API_KEY
- HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, HEDERA_NETWORK
- `XRPL_ENABLED`: `true` (o `false` para ahorrar memoria si no usas XRP)
- `ALGORAND_ENABLED`: `true` (o `false` para ahorrar memoria)
- `DISABLE_HEDERA`: `1` (Opcional, si quieres desactivar Hedera para ahorrar memoria)
- `DISABLE_MONGO`: `1` (Si aún no tienes DB)
- `DISABLE_REDIS`: `1` (Recomendado si no tienes Redis configurado para evitar reintentos y logs)
- `DISABLE_SWAGGER`: `1` (Recomendado para ahorrar memoria en producción)
- `DISABLE_BULLBOARD`: `1` (Recomendado para ahorrar memoria en producción)

## 1. Preparación (GitHub)
Asegúrate de subir los cambios más recientes, incluyendo las optimizaciones de memoria en `app.js` y `package.json`.

```bash
# Estando en la raíz del proyecto
git add server/package.json server/Dockerfile server/.dockerignore server/src/app.js server/.env.example.koyeb
git commit -m "Fix Koyeb deployment: OOM fixes and memory optimizations"
git push origin main
```

## 2. Crear Servicio en Koyeb
1. Inicia sesión en [Koyeb](https://app.koyeb.com/).
2. Haz clic en **Create App** (o Create Service).
3. Selecciona **GitHub** como método de despliegue.
4. Busca y selecciona tu repositorio: `AcademicChain-Ledger`.

## 3. Configuración del Build (Importante)
En la sección de configuración del servicio:

- **Builder**: Selecciona `Dockerfile`.
- **Docker workdir**: Deja esto en blanco o pon `/app` (usualmente no es necesario cambiarlo si el Dockerfile está bien).
- **Build args**: No es necesario.
- **Work directory** (o Root Directory): Escribe **`server`**.
  - *Esto es crucial porque tu backend no está en la raíz del repo, sino en la carpeta `server`.*
- **Privileged**: Desactivado (no es necesario).

## 4. Variables de Entorno
Ve a la sección **Environment Variables**. Debes agregar todas las variables que están en el archivo `server/.env.example.koyeb`.

Las más críticas son:

| Variable | Valor | Nota |
|----------|-------|------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | Debe coincidir con el Dockerfile. |
| `CLIENT_URL` | `https://academic-chain-ledger.vercel.app` | **CRÍTICO**: Sin espacios al final. |
| `HEDERA_NETWORK` | `testnet` | |
| `MONGODB_URI` | `...` | Tu conexión a Mongo Atlas. |
| `JWT_SECRET` | `...` | Crea una contraseña segura. |

*Copia el resto de variables (HEDERA_*, XRPL_*, etc.) desde `server/.env.example.koyeb`.*

## 5. Exposición de Puertos
En la sección **Instance** o **Ports**:
- **Port**: `3001`
- **Protocol**: `HTTP`
- **Public path**: `/`

## 6. Desplegar
Haz clic en **Deploy**.

## 7. Verificación
Una vez que el estado cambie a **Healthy**:
1. Copia la URL pública que te da Koyeb (ej. `https://tu-app-name.koyeb.app`).
2. Abre esa URL en el navegador. Deberías ver un mensaje de bienvenida o un JSON del servidor.
3. **Paso Final**: Ve a tu proyecto de **Vercel** (Frontend) y actualiza la variable `VITE_API_URL` con esta nueva URL de Koyeb.
