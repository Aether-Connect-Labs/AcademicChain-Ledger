#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

console.log('🎓 AcademicChain Ledger - Configuración Automática\n');

function question(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => { rl.close(); resolve(answer); }));
}

async function setupEnvironment() {
  // Generar secretos seguros
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const refreshSecret = crypto.randomBytes(64).toString('hex');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  
  console.log('✅ Secretos de seguridad generados');

  let mongoDbUri, redisUri;
  const dockerRunning = await checkDocker().catch(() => false);

  if (dockerRunning) {
    console.log('🐳 Docker detectado. Usando configuración local para MongoDB y Redis.');
    mongoDbUri = 'mongodb://localhost:27017/academicchain';
    redisUri = 'redis://localhost:6379';
  } else {
    console.log('⚠️ Docker no está en ejecución. Por favor, introduce las credenciales de tus servicios manualmente.');
    mongoDbUri = await question('MongoDB Atlas URI: ');
    redisUri = await question('Redis Cloud URI: ');
  }

  // Solicitar credenciales que siempre son manuales
  const hederaAccountId = await question('Hedera Account ID (0.0.xxxxx): ');
  const hederaPrivateKey = await question('Hedera Private Key: ');
  const pinataApiKey = await question('Pinata API Key: ');
  const pinataSecretKey = await question('Pinata Secret Key: ');
  
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
  ensureGitignore();

  console.log('\n✅ Archivo .env unificado creado en la raíz del proyecto.');
  
  if (dockerRunning) {
    console.log('🚀 Iniciando servicios de Docker (MongoDB y Redis). Esto puede tardar un momento la primera vez...');
    await runDockerCompose();
    console.log('\n✅ ¡Servicios listos! Ahora puedes arrancar la aplicación con: npm run dev');
  } else {
    console.log('\n🚀 Configuración completa. Asegúrate de que tus servicios externos de MongoDB y Redis estén accesibles.');
    console.log('Ahora puedes arrancar la aplicación con: npm run dev');
  }
}

function checkDocker() {
  return new Promise(resolve => {
    exec('docker info', (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function runDockerCompose() {
  return new Promise((resolve, reject) => {
    const dockerProcess = spawn('npm', ['run', 'docker:up'], { stdio: 'inherit', shell: true, detached: false });
    dockerProcess.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El proceso de Docker falló con código ${code}`));
      }
    });
  });
}

function ensureGitignore() {
  const gitignorePath = '.gitignore';
  const envEntry = '\n# Archivo de variables de entorno\n.env\n';

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      fs.appendFileSync(gitignorePath, envEntry);
      console.log('✅ ".env" añadido a .gitignore');
    }
  }
}

setupEnvironment().catch(console.error);