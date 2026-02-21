// n8n-health-check.js
// Validación de Webhooks, Seguridad (X-ACL-AUTH-KEY) y ENV en n8n.
//
// Uso:
//   node scripts/n8n-health-check.js
//
// Vars:
//   N8N_BASE_URL        -> Base URL de n8n (ej: https://n8n-b0be.onrender.com)
//   N8N_AUTH_KEY        -> Clave que debe coincidir con $env.ACL_AUTH_KEY en n8n
//   TEST_PDF_URL        -> URL PDF público para probar lectura de CV
//   TEST_IMAGE_URL      -> URL imagen pública (JPG/PNG) para OCR
//
// Nota: Usa fetch nativo (Node 18+), sin dependencias externas.

const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-b0be.onrender.com';
const AUTH_KEY = process.env.N8N_AUTH_KEY || 'acl_live_sec_8f92a3b4';
const TEST_PDF_URL = process.env.TEST_PDF_URL || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const TEST_IMAGE_URL = process.env.TEST_IMAGE_URL || 'https://upload.wikimedia.org/wikipedia/commons/7/77/Delete_key1.jpg';

const ROUTES = {
  emitir: '/webhook/emitir-multichain',
  cvGenerate: '/webhook/generate-smart-cv',
  cvSearch: '/webhook/search-talent',
  createPayment: '/webhook/create-payment',
  verifyPayment: '/webhook/verify-payment',
  employerReport: '/webhook/generate-employer-report',
  employerVerifyBatch: '/webhook/employer-verify-batch',
  envHealth: '/webhook/env-health'
};

function title(s) {
  console.log('\n' + '='.repeat(s.length));
  console.log(s);
  console.log('='.repeat(s.length));
}

async function call(url, { method = 'GET', headers = {}, body } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const opts = { method, headers: { ...headers }, signal: controller.signal };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, json, text: json ? undefined : text };
  } finally {
    clearTimeout(t);
  }
}

async function testWebhookStatus() {
  title('Estado de Webhooks');
  // Emisión (protegido)
  const emitirUrl = `${BASE_URL}${ROUTES.emitir}?documentHash=hash-${Date.now()}&studentName=HealthCheck&plan=base`;
  const emitir = await call(emitirUrl, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { pdfUrl: TEST_PDF_URL } });
  console.log('Emitir (POST, auth):', emitir.status, emitir.ok ? 'OK' : 'FAIL');
  if (emitir.json && emitir.json.data) {
    console.log('  ipfsURI:', emitir.json.data.ipfsURI || 'n/a');
    console.log('  uniqueHash:', emitir.json.data.uniqueHash || 'n/a');
  }

  // CV
  const cvGen = await call(`${BASE_URL}${ROUTES.cvGenerate}`, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { profile: { name: 'Health', skills: ['test'] } } });
  console.log('Smart CV Generate (POST):', cvGen.status, cvGen.ok ? 'OK' : 'FAIL');

  const cvSearch = await call(`${BASE_URL}${ROUTES.cvSearch}`, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { query: 'developer' } });
  console.log('Smart CV Search (POST):', cvSearch.status, cvSearch.ok ? 'OK' : 'FAIL');

  // Pagos
  const payCreate = await call(`${BASE_URL}${ROUTES.createPayment}`, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { amount: 10, currency: 'USD' } });
  console.log('Create Payment (POST):', payCreate.status, payCreate.ok ? 'OK' : 'FAIL');

  const payVerify = await call(`${BASE_URL}${ROUTES.verifyPayment}`, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { txId: 'health-check' } });
  console.log('Verify Payment (POST):', payVerify.status, payVerify.ok ? 'OK' : 'FAIL');

  // Reportes
  const report = await call(`${BASE_URL}${ROUTES.employerReport}`, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }, body: { employerId: 'health-check', range: { from: '2024-01-01', to: '2024-12-31' } } });
  console.log('Employer Report (POST):', report.status, report.ok ? 'OK' : 'FAIL');

  // Employer Bulk Verify (PDF/Imagen)
  const batch = await call(`${BASE_URL}${ROUTES.employerVerifyBatch}`, {
    method: 'POST',
    headers: { 'X-ACL-AUTH-KEY': AUTH_KEY },
    body: {
      items: [
        { url: TEST_PDF_URL },
        { url: TEST_IMAGE_URL }
      ]
    }
  });
  console.log('Employer Verify Batch (POST):', batch.status, batch.ok ? 'OK' : 'FAIL');
  if (batch.json) {
    const first = Array.isArray(batch.json) ? batch.json[0] : batch.json;
    console.log('  identityId:', first?.json?.identityId ?? 'n/a');
    console.log('  hasBlockchainProof:', first?.json?.hasBlockchainProof ?? 'n/a');
  }
}

async function testSecurity() {
  title('Seguridad (Auth Check)');
  // Orquestador sin header → debería rechazar (401)
  const emitirNoAuth = await call(`${BASE_URL}${ROUTES.emitir}?documentHash=hash-${Date.now()}&studentName=NoAuth&plan=base`, { method: 'POST' });
  console.log('Emitir sin auth (POST):', emitirNoAuth.status, emitirNoAuth.status === 401 ? 'BLOCKED ✅' : 'UNEXPECTED');

  // Employer report sin auth → también protegido idealmente
  const reportNoAuth = await call(`${BASE_URL}${ROUTES.employerReport}`, { method: 'POST' });
  console.log('Employer Report sin auth (POST):', reportNoAuth.status, reportNoAuth.status === 401 || reportNoAuth.status === 403 ? 'BLOCKED ✅' : 'CHECK CONFIG');
}

async function testEnv() {
  title('Conectividad ENV (opcional)');
  const resp = await call(`${BASE_URL}${ROUTES.envHealth}`, { headers: { 'X-ACL-AUTH-KEY': AUTH_KEY } });
  if (resp.status === 404) {
    console.log('Endpoint env-health no disponible. Importa n8n/workflows/env-health.json en tu instancia para habilitar esta verificación.');
    return;
  }
  if (!resp.ok) {
    console.log('Env health devolvió estado:', resp.status);
    return;
  }
  const env = resp.json && resp.json.env ? resp.json.env : {};
  console.log('Hedera:', env.hedera ? 'OK' : 'MISSING');
  console.log('XRP:', env.xrp ? 'OK' : 'MISSING');
  console.log('Algorand:', env.algorand ? 'OK' : 'MISSING');
  console.log('Pinata JWT:', env.pinata ? 'OK' : 'MISSING');
  console.log('ACL Key:', env.acl ? 'OK' : 'MISSING');
}

async function main() {
  console.log('🚦 Iniciando N8N Health Check');
  console.log('Base URL:', BASE_URL);
  await testWebhookStatus();
  await testSecurity();
  await testEnv();
  console.log('\n✅ Health Check completado.');
}

main().catch((e) => {
  console.error('Health Check error:', e);
  process.exit(1);
});
