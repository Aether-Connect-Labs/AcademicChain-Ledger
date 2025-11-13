#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎓 AcademicChain Ledger - Configuración Automática\n');

async function setupEnvironment() {
  // Generar secretos seguros
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const refreshSecret = crypto.randomBytes(64).toString('hex');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  
  console.log('✅ Secretos de seguridad generados');
  
  // Solicitar credenciales de Hedera
  const hederaAccountId = await question('Hedera Account ID (0.0.xxxxx): ');
  const hederaPrivateKey = await question('Hedera Private Key: ');
  const pinataApiKey = await question('Pinata API Key: ');
  const pinataSecretKey = await question('Pinata Secret Key: ');
  const mongoDbUri = await question('MongoDB Atlas URI: ');
  const redisUri = await question('Redis Cloud URI: ');
  
  const envContent = `
# ==============================================
# AcademicChain Ledger - Variables de Entorno
# Generado automáticamente por setup-env.js
# ==============================================

# Configuración de la Aplicación
NODE_ENV=development
PORT=3001

# Servicios en la Nube
MONGODB_URI=${mongoDbUri}
REDIS_URL=${redisUri}

# Secretos de Seguridad
JWT_SECRET=${jwtSecret}
REFRESH_TOKEN_SECRET=${refreshSecret}
SESSION_SECRET=${sessionSecret}

# Credenciales de Servicios Externos
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=${hederaAccountId}
HEDERA_PRIVATE_KEY=${hederaPrivateKey}
PINATA_API_KEY=${pinataApiKey}
PINATA_SECRET_API_KEY=${pinataSecretKey}
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env unificado creado en la raíz del proyecto.');
  
  console.log('🚀 Configuración completa. Ejecuta: npm run docker:up');
  
  rl.close();
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

setupEnvironment().catch(console.error);