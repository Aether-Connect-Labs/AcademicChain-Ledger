// Script de verificación de servicios para AcademicChain Ledger
const mongoose = require('mongoose');
const { createClient } = require('redis');
const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkMongoDB() {
  log('\n📊 Verificando MongoDB...', 'cyan');
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academicchain';
    await mongoose.connect(mongoURI, { 
      serverSelectionTimeoutMS: 3000 
    });
    await mongoose.disconnect();
    log('   ✅ MongoDB: CONECTADO', 'green');
    return true;
  } catch (error) {
    log(`   ❌ MongoDB: NO CONECTADO - ${error.message}`, 'red');
    return false;
  }
}

async function checkRedis() {
  log('\n💾 Verificando Redis...', 'cyan');
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });
    await client.connect();
    await client.ping();
    await client.quit();
    log('   ✅ Redis: CONECTADO', 'green');
    return true;
  } catch (error) {
    log(`   ❌ Redis: NO CONECTADO - ${error.message}`, 'red');
    return false;
  }
}

async function checkHedera() {
  log('\n⛓️  Verificando Hedera Hashgraph...', 'cyan');
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  if (!accountId || accountId.includes('YOUR_ACCOUNT_ID')) {
    log('   ⚠️  Hedera: NO CONFIGURADO (Account ID faltante)', 'yellow');
    return false;
  }
  if (!privateKey || privateKey.includes('YOUR_PRIVATE_KEY')) {
    log('   ⚠️  Hedera: NO CONFIGURADO (Private Key faltante)', 'yellow');
    return false;
  }
  
  log(`   ✅ Hedera: CONFIGURADO (Network: ${network}, Account: ${accountId})`, 'green');
  log('   ℹ️  La conexión real se verifica al usar el servicio', 'blue');
  return true;
}

async function checkPinata() {
  log('\n📦 Verificando Pinata/IPFS...', 'cyan');
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;
  
  if (!apiKey || apiKey.includes('your_pinata')) {
    log('   ⚠️  Pinata: NO CONFIGURADO (API Key faltante)', 'yellow');
    return false;
  }
  if (!secretKey || secretKey.includes('your_pinata')) {
    log('   ⚠️  Pinata: NO CONFIGURADO (Secret Key faltante)', 'yellow');
    return false;
  }
  
  // Intentar conectar
  try {
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      },
      timeout: 5000
    });
    log('   ✅ Pinata: CONECTADO Y FUNCIONANDO', 'green');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 200) {
      log('   ✅ Pinata: CONECTADO', 'green');
      return true;
    }
    log(`   ⚠️  Pinata: CONFIGURADO pero respuesta: ${error.message}`, 'yellow');
    return false;
  }
}

async function checkServer() {
  log('\n🚀 Verificando Servidor API...', 'cyan');
  try {
    const response = await axios.get('http://localhost:3001/health', { timeout: 2000 });
    log('   ✅ Servidor API: ACTIVO', 'green');
    log(`   📍 Status: ${response.data.status}`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Servidor API: NO DISPONIBLE - ${error.message}`, 'red');
    return false;
  }
}

async function checkClient() {
  log('\n🌐 Verificando Cliente Web...', 'cyan');
  try {
    const response = await axios.get('http://localhost:3000', { timeout: 2000 });
    log('   ✅ Cliente Web: ACTIVO', 'green');
    return true;
  } catch (error) {
    log(`   ⚠️  Cliente Web: NO DISPONIBLE - ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('   ACADEMICCHAIN LEDGER - DIAGNÓSTICO DE SERVICIOS', 'cyan');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const results = {
    mongodb: await checkMongoDB(),
    redis: await checkRedis(),
    hedera: await checkHedera(),
    pinata: await checkPinata(),
    server: await checkServer(),
    client: await checkClient()
  };
  
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('                   RESUMEN', 'cyan');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const critical = ['mongodb', 'server'];
  const important = ['redis', 'hedera', 'pinata'];
  
  log('📋 SERVICIOS CRÍTICOS (Necesarios):', 'yellow');
  critical.forEach(service => {
    if (results[service]) {
      log(`   ✅ ${service.toUpperCase()}: OK`, 'green');
    } else {
      log(`   ❌ ${service.toUpperCase()}: FALTA`, 'red');
    }
  });
  
  log('\n📋 SERVICIOS IMPORTANTES (Recomendados):', 'yellow');
  important.forEach(service => {
    if (results[service]) {
      log(`   ✅ ${service.toUpperCase()}: OK`, 'green');
    } else {
      log(`   ⚠️  ${service.toUpperCase()}: NO CONFIGURADO`, 'yellow');
    }
  });
  
  log('\n📋 CLIENTE:', 'yellow');
  if (results.client) {
    log(`   ✅ CLIENT: OK`, 'green');
  } else {
    log(`   ⚠️  CLIENT: Iniciando...`, 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════════\n', 'cyan');
  
  const allCriticalOk = critical.every(service => results[service]);
  
  if (allCriticalOk) {
    log('✅ El proyecto puede funcionar básicamente', 'green');
    log('⚠️  Algunas funcionalidades avanzadas pueden no estar disponibles', 'yellow');
  } else {
    log('❌ Faltan servicios críticos para funcionar completamente', 'red');
  }
  
  log('\n💡 RECOMENDACIONES:', 'cyan');
  if (!results.mongodb) {
    log('   1. Instala MongoDB o usa Docker: docker run -d -p 27017:27017 mongo', 'yellow');
  }
  if (!results.redis) {
    log('   2. Instala Redis o usa Docker: docker run -d -p 6379:6379 redis', 'yellow');
  }
  if (!results.hedera) {
    log('   3. Configura HEDERA_ACCOUNT_ID y HEDERA_PRIVATE_KEY en server/.env', 'yellow');
  }
  if (!results.pinata) {
    log('   4. Obtén credenciales de Pinata en https://pinata.cloud y configúralas', 'yellow');
  }
  
  process.exit(allCriticalOk ? 0 : 1);
}

main().catch(console.error);

