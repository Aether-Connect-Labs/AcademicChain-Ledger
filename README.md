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
- Node.js 18+
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

### 6) Verificación rápida
- Salud del backend: `http://localhost:3001/health` y `http://localhost:3001/ready`
- Emisión individual: en el dashboard, usa “Emitir Título”
- Emisión masiva: en el dashboard, usa “Subir Excel”, indicando el `Token ID`
- Progreso de trabajos: se actualiza en tiempo real vía WebSocket

### 7) Problemas comunes
- Errores de conexión a MongoDB: asegúrate de que el contenedor de Mongo esté corriendo (`docker ps`) o ajusta `MONGODB_URI`
- WebSocket bloqueado por CORS: verifica `CLIENT_URL` en `server/.env` incluye el puerto del frontend
- Vite cambia a `5174`: actualiza `CLIENT_URL` y abre el frontend en el nuevo puerto

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

La aplicación estará disponible en `http://localhost:3001` (o el puerto que hayas configurado).
Con este cambio, tu `README.md` ahora tiene una guía de instalación limpia, profesional y precisa para cualquier persona que quiera usar tu proyecto.

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

La aplicación estará disponible en `http://localhost:3001` (o el puerto que hayas configurado).# 🎓 AcademicChain Ledger

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

La aplicación estará disponible en `http://localhost:3001` (o el puerto que hayas configurado).
## 🚀 Guía de Instalación y Puesta en Marcha
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
