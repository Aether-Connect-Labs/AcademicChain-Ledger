const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('client/.env') });

const RAW_WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL;
const AUTH_KEY = process.env.VITE_N8N_AUTH_KEY;

if (!RAW_WEBHOOK_URL) {
  console.error('❌ Error: VITE_N8N_WEBHOOK_URL no está definido en client/.env');
  process.exit(1);
}

function getN8nUrl(endpoint) {
  let baseUrl = RAW_WEBHOOK_URL;
  if (baseUrl.endsWith('/submit-document')) {
    return baseUrl.replace('submit-document', endpoint);
  }
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  return `${baseUrl}/${endpoint}`;
}

console.log('\n🔍 Probando conexión a n8n...');
console.log(`URL Base: ${RAW_WEBHOOK_URL}`);
console.log(`Auth Key: ${AUTH_KEY ? 'Configurada' : 'NO Configurada'}\n`);

async function testEndpoint(endpoint, data, name) {
  const url = getN8nUrl(endpoint);
  console.log(`Testing ${name}... (${endpoint})`);

  try {
    const start = Date.now();
    const response = await axios.post(url, data, {
      headers: {
        'X-ACL-AUTH-KEY': AUTH_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const duration = Date.now() - start;

    console.log(`✅ ${name}: Éxito (${duration}ms)`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Falló`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('   No hubo respuesta (Timeout o error de red)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  let successCount = 0;
  const tests = [
    {
      endpoint: 'generate-smart-cv',
      name: 'Generar Smart CV',
      data: {
        linkedInUrl: 'https://linkedin.com/in/test',
        jobDescription: 'Software Engineer'
      }
    },
    {
      endpoint: 'search-talent',
      name: 'Buscar Talento',
      data: {
        skills: ['React', 'Node.js'],
        role: 'Frontend Developer'
      }
    },
    {
      endpoint: 'create-payment',
      name: 'Crear Pago',
      data: {
        amount: 10,
        currency: 'USD',
        plan: 'test'
      }
    }
  ];

  for (const t of tests) {
    const ok = await testEndpoint(t.endpoint, t.data, t.name);
    if (ok) successCount++;
  }

  console.log(`\n📊 Resultados: ${successCount}/${tests.length} pruebas exitosas.`);

  if (successCount === tests.length) {
    console.log('🎉 Conexión a n8n verificada correctamente.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Verifica que los workflows estén activos en n8n.');
  }
}

runTests();
