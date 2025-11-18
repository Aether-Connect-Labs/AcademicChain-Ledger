const fs = require('fs');
const path = require('path');

// Ruta al archivo app.js
const filePath = path.join(__dirname, 'server', 'src', 'app.js');

// Leer el archivo
console.log('Leyendo archivo app.js...');
let content = fs.readFileSync(filePath, 'utf8');

// Contar cuántas instancias hay que reemplazar
const instancesBefore = (content.match(/=\\u003e/g) || []).length;
console.log(`Instancias de =\\u003e encontradas: ${instancesBefore}`);

// Reemplazar todas las instancias de =\u003e con =\u003e
content = content.replace(/=\\u003e/g, '=>');

// Contar cuántas se reemplazaron
const instancesAfter = (content.match(/=\\u003e/g) || []).length;
console.log(`Instancias de =\\u003e después del reemplazo: ${instancesAfter}`);

// Escribir el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');
console.log('Archivo app.js corregido exitosamente');

// Mostrar algunas líneas corregidas para verificación
const lines = content.split('\n');
console.log('\nLíneas corregidas:');
lines.filter(line => line.includes('=>')).slice(0, 5).forEach(line => {
  console.log(`→ ${line.trim()}`);
});