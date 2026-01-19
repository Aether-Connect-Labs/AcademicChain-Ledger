# Configuración de Almacenamiento Persistente con Filecoin

AcademicChain utiliza **Lighthouse** como gateway para interactuar con la red **Filecoin**. Esto nos permite asegurar la permanencia a largo plazo de los diplomas y credenciales académicas, cumpliendo con los estándares de archivo digital.

## ¿Por qué Filecoin?
Mientras que IPFS permite un acceso rápido y descentralizado a través de CIDs (Content Identifiers), por defecto no garantiza que el contenido persista si el nodo que lo aloja se desconecta. Filecoin añade una capa de incentivos económicos donde los mineros de almacenamiento firman contratos ("Deals") para guardar la información por periodos definidos, asegurando redundancia y disponibilidad.

## Configuración Requerida

Para habilitar esta funcionalidad en tu entorno local o de producción, necesitas obtener una API Key gratuita de Lighthouse.

### Pasos:

1.  Ve a [Lighthouse Storage](https://lighthouse.storage/).
2.  Inicia sesión (puedes usar tu wallet o Google).
3.  Ve a la sección "API Key" y genera una nueva llave.
4.  Agrega esta llave a tu archivo `.env` en la carpeta `server/`:

```env
LIGHTHOUSE_API_KEY=tu_api_key_aqui
```

### Verificación

Una vez configurada la variable, el sistema automáticamente detectará la llave y cambiará el modo de subida de "Solo IPFS" a "IPFS + Filecoin".

Puedes verificar que está funcionando al emitir una credencial:
1.  El sistema mostrará en los logs: `✅ Archivo subido exitosamente a Filecoin`.
2.  En la base de datos, el registro de la credencial tendrá `storageProtocol: 'IPFS+Filecoin'`.
3.  Podrás ver el estado del almacenamiento en el dashboard de Lighthouse.

## Fallback Automático

Si la API Key no está configurada o el servicio de Lighthouse falla momentáneamente, el sistema está diseñado para hacer un "fallback" automático al servicio de IPFS estándar (Pinata o nodo local) para no interrumpir la emisión de títulos.
