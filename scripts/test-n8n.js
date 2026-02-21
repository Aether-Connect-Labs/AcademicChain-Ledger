const http = require('http');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: 'localhost',
      port: 5678,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  const acl = process.env.N8N_TEST_ACL || 'acl_live_sec_8f92a3b4';
  const headers = { 'X-ACL-AUTH-KEY': acl };

  const tests = [
    { name: 'stats-credentials', method: 'GET', path: '/webhook/stats-credentials' },
    {
      name: 'submit-document',
      method: 'POST',
      path: '/webhook/submit-document',
      body: {
        documentHash: 'titulo-prueba-' + Date.now(),
        userId: 'institution-demo',
        metadata: {
          credentialType: 'Titulo',
          studentName: 'Alumno Prueba',
          studentId: 'STU-TEST-001',
          degree: 'Grado en Ingeniería de Prueba',
          major: 'Blockchain y Sistemas Distribuidos',
          institution: 'Universidad Demo AcademicChain',
          issueDate: new Date().toISOString().split('T')[0],
          expirationDate: null,
          notes: 'Emisión de título de prueba vía n8n-test'
        },
        issuanceType: 'title',
        networks: ['hedera']
      }
    },
    {
      name: 'emitir-multichain',
      method: 'POST',
      path: '/webhook/emitir-multichain?documentHash=titulo-prueba-full&studentName=Alumno+Prueba+Full&plan=triple',
      body: {}
    },
    {
      name: 'issue-creator-credential',
      method: 'POST',
      path: '/webhook/issue-creator-credential',
      body: {
        creatorId: 'creator-test',
        studentName: 'Test User',
        credentialType: 'Curso',
        title: 'Test Credential'
      }
    },
    {
      name: 'request-credential-verification',
      method: 'POST',
      path: '/webhook/request-credential-verification',
      body: {
        credentialId: 'cred-test',
        issuerId: 'issuer-test'
      }
    }
  ];

  for (const t of tests) {
    try {
      const res = await request(t.method, t.path, t.body, headers);
      console.log('---', t.name, '---');
      console.log('Status:', res.status);
      console.log(typeof res.body === 'string' ? res.body.slice(0, 800) : res.body);
    } catch (e) {
      console.log('---', t.name, '---');
      console.error('Error:', e.message || e);
    }
  }
}

run().catch((e) => {
  console.error('Request failed:', e.message || e);
  process.exit(1);
});
