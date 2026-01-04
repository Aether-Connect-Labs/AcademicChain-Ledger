require('dotenv').config();

const requiredVars = [
  'HEDERA_ACCOUNT_ID',
  'HEDERA_PRIVATE_KEY',
  'MONGODB_URI',
  'JWT_SECRET',
  'BASE_URL',
  'CLIENT_URL',
  'NODE_ENV'
];

const presentVars = [];
const missingVars = [];

for (const varName of requiredVars) {
  if (process.env[varName] && process.env[varName] !== 'value') {
    presentVars.push(varName);
  } else {
    missingVars.push(varName);
  }
}

process.stdout.write('🔍 VERIFICANDO CONFIGURACIÓN ACTUAL...\n\n');
process.stdout.write('VARIABLES CONFIGURADAS:\n');
for (const v of presentVars) process.stdout.write(`✅ ${v}\n`);

process.stdout.write('\nVARIABLES FALTANTES O INVÁLIDAS:\n');
for (const v of missingVars) process.stdout.write(`❌ ${v}\n`);

process.stdout.write('\n🔗 XRP LEDGER STATUS:\n');
if (process.env.XRPL_SEED && process.env.XRPL_SEED !== 'value') {
  process.stdout.write('✅ XRP Configurado\n');
} else {
  process.stdout.write('❌ XRP No configurado - NECESARIO\n');
}

process.stdout.write('\n🎯 ACCIONES REQUERIDAS:\n');
if (missingVars.length > 0) process.stdout.write('1. Configurar variables faltantes en el entorno de despliegue\n');
if (!process.env.XRPL_SEED || process.env.XRPL_SEED === 'value') process.stdout.write('2. Generar wallet XRP y agregar XRPL_SEED al entorno\n');
process.stdout.write('3. Verificar que BASE_URL y CLIENT_URL sean las correctas\n');
