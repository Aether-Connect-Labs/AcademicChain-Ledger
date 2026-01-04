# Guía de Despliegue en Koyeb (Backend)

Sigue estos pasos para desplegar tu servidor Node.js en Koyeb.

## 1. Preparación (GitHub)
Asegúrate de haber subido los últimos cambios al repositorio, especialmente el archivo `server/Dockerfile` que acabo de crear.

```bash
git add server/Dockerfile
git commit -m "Add Dockerfile for Koyeb"
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
| `CLIENT_URL` | `https://academic-chain-ledger-client.vercel.app` | **CRÍTICO**: Sin espacios al final. |
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
