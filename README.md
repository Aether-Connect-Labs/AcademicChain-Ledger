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
