Se corrige el package.json raíz que contenía una sección duplicada y una llave sobrante; se consolida en un JSON válido.

Checklist:
- Ejecutar npm install y npm run client:build localmente
- Añadir variables de entorno necesarias en Vercel (MONGODB_URI, BACKEND_URL)
- Probar despliegue del cliente en Vercel