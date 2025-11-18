# Guía de Despliegue en Vercel

Este documento describe el flujo de despliegue para el proyecto AcademicChain Ledger en Vercel.

## 1. Configuración del Entorno Local

Para el desarrollo y las pruebas locales, es necesario configurar las variables de entorno. El proyecto incluye un script para facilitar este proceso.

Ejecuta el siguiente comando y sigue las instrucciones para introducir tus credenciales:

```bash
node setup-env.js
```

Este script creará un archivo `.env` en la raíz del proyecto con todas las variables necesarias para que la aplicación se ejecute localmente.

## 2. Configuración de Vercel (`vercel.json`)

El archivo `vercel.json` en la raíz del proyecto le indica a Vercel cómo construir y desplegar la aplicación. Está configurado para manejar tanto el frontend del cliente como el backend del servidor:

- **Build del Cliente**: Construye el frontend de React (`client`) como un sitio estático.
- **Build del Servidor**: Despliega el backend de Node.js (`server/api/index.js`) como una función sin servidor.
- **Rutas**:
  - Las solicitudes a `/api/...` se dirigen a la función del backend.
  - Todas las demás solicitudes se dirigen al frontend de React.

## 3. Despliegue Automático con GitHub Actions

El proyecto está configurado con un flujo de trabajo de Integración y Despliegue Continuo (CI/CD) utilizando GitHub Actions.

- **Disparador**: El flujo de trabajo se activa automáticamente cada vez que se realiza un `push` a la rama `main`.
- **Archivo de Flujo de Trabajo**: La configuración se encuentra en `.github/workflows/deploy.yml`.
- **Proceso**: La acción de GitHub utiliza el `vercel-action` para desplegar el proyecto en Vercel, utilizando los secretos configurados en el repositorio de GitHub.

## 4. Variables de Entorno en Vercel

Para que el despliegue en Vercel funcione, las variables de entorno (las mismas que se encuentran en el archivo `.env`) deben configurarse en el panel de control de tu proyecto en Vercel.

**ID del Proyecto en Vercel**: `prj_IfkZuo5JgWKVgiy6ECk3aCyMvBVt`

### Pasos para configurar las variables de entorno en Vercel:

1.  Ve al panel de control de tu proyecto en Vercel.
2.  Navega a la pestaña **Settings** y luego a **Environment Variables**.
3.  Añade cada una de las variables de tu archivo `.env` (por ejemplo, `MONGODB_URI`, `JWT_SECRET`, etc.) como secretos.

Este flujo de trabajo asegura que los despliegues sean automáticos y consistentes, y que la configuración del entorno esté separada del código fuente.