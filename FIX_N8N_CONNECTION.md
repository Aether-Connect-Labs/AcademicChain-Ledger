# Guía de Reparación de Conexión n8n

El diagnóstico ha revelado que el servidor n8n está activo pero el Webhook `submit-document` está configurado incorrectamente (acepta **GET** en lugar de **POST**).

Para solucionar esto y permitir la emisión real de credenciales, sigue estos pasos:

## 1. Actualizar el Workflow en n8n

1.  Abre tu instancia de n8n: [https://n8n-b0be.onrender.com/](https://n8n-b0be.onrender.com/)
2.  Busca el workflow llamado "AcademicChain Backend API" (o similar).
3.  Haz doble clic en el nodo **Webhook Submit** (el primero).
4.  Cambia el campo **HTTP Method** de `GET` a `POST`.
5.  Asegúrate de que **Path** sea `submit-document`.
6.  Cierra el nodo y haz clic en **Save** (arriba a la derecha).
7.  Asegúrate de que el interruptor **Active** esté en verde (Activado).

## 2. Verificar la Solución

Una vez hecho el cambio en n8n, ejecuta el script de diagnóstico nuevamente:

```bash
node scripts/test-n8n-emission.js
```

Deberías ver un mensaje: `✅ SUCCESS: Production Webhook is working!`

## 3. Comportamiento en la Web

He actualizado el código de la web (`n8nService.js`) para que sea robusto:
- Si la conexión falla (como ahora), la web **no se romperá**. Usará una simulación automática para que puedas completar la demo.
- Cuando arregles el servidor n8n (paso 1), la web conectará automáticamente con el sistema real.

---
**Nota Técnica:**
El error `404 Not Found: This webhook is not registered for POST requests` confirma que la URL es correcta pero el método HTTP no coincide. La actualización del código cliente ya apunta a la URL correcta (`https://n8n-b0be.onrender.com`), por lo que el único paso restante es la configuración del servidor descrita arriba.
