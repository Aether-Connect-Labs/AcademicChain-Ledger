import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config({ path: path.resolve('client/.env') });

const WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL;
const AUTH_KEY = process.env.VITE_N8N_AUTH_KEY;

if (!WEBHOOK_URL) {
  console.error('❌ Error: VITE_N8N_WEBHOOK_URL no está definido en client/.env');
  process.exit(1);
}

console.log(`\n🔍 Probando conexión a n8n...`);
console.log(`URL Base: ${WEBHOOK_URL}`);
console.log(`Auth Key: ${AUTH_KEY ? 'Configurada' : 'NO Configurada'}\n`);

async function testEndpoint(endpoint, data, name) {
  const url = `${WEBHOOK_URL}/${endpoint}`;
  console.log(`Testing ${name}... (${endpoint})`);
  
  try {
    const start = Date.now();
    const response = await axios.post(url, data, {
      headers: { 
        'X-ACL-AUTH-KEY': AUTH_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10s timeout
    });
    const duration = Date.now() - start;
    
    console.log(`✅ ${name}: Éxito (${duration}ms)`);
    // console.log('Response:', JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Falló`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log(`   No hubo respuesta (Timeout o error de red)`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  let successCount = 0;
  let totalTests = 3;

  // Test 1: Check Account (Mock data)
  const t1 = await testEndpoint('check-account', { email: 'test@example.com' }, 'Verificar Cuenta');
  if (t1) successCount++;

  // Test 2: Generate Smart CV (Mock data)
  const t2 = await testEndpoint('generate-smart-cv', { 
    linkedInUrl: 'https://linkedin.com/in/test',
    jobDescription: 'Software Engineer' 
  }, 'Generar Smart CV');
  if (t2) successCount++;

  // Test 3: Search Talent (Mock data)
  const t3 = await testEndpoint('search-talent', { 
    skills: ['React', 'Node.js'],
    role: 'Frontend Developer'
  }, 'Buscar Talento');
  if (t3) successCount++;

  console.log(`\n📊 Resultados: ${successCount}/${totalTests} pruebas exitosas.`);
  
  if (successCount === totalTests) {
    console.log('🎉 Conexión a n8n verificada correctamente.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Verifica que los workflows estén activos en n8n.');
  }
}

runTests();
