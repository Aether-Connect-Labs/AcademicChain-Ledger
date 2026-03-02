
const http = require('http');

// Helper to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTest() {
  const studentId = `SIM-TEST-${Math.floor(Math.random() * 10000)}`;
  console.log(`[Test] Starting certification flow for ${studentId}...`);

  // 1. Send Certification Request
  const postData = {
    studentName: "Simulation Tester",
    studentId: studentId,
    courseName: "Fallback Validation 101",
    graduationDate: "2026-03-02",
    institutionId: "TEST-INST"
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/certify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, postData);

    console.log(`[Test] Certify Response Code: ${response.statusCode}`);
    console.log(`[Test] Response Details:`, response.body);

    if (response.body.details && response.body.details.hcsStatus === 'simulated') {
      console.log('✅ SUCCESS: System correctly entered Simulation Mode (hcsStatus: simulated)');
    } else if (response.body.details && response.body.details.hcsStatus === 'verified') {
      console.log('⚠️ UNEXPECTED: System verified HCS transaction (expected simulation/fallback)');
    } else {
      console.log('❌ FAILURE: Unexpected hcsStatus or missing details');
    }

    // 2. Poll for Completion
    console.log('[Test] Polling for completion...');
    let attempts = 0;
    const maxAttempts = 10;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      const statusRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/student/${studentId}/status`,
        method: 'GET'
      });

      console.log(`[Test] Poll #${attempts}: Status = ${statusRes.body.status}`);

      if (statusRes.body.status === 'completed') {
        clearInterval(pollInterval);
        console.log('✅ SUCCESS: Certification flow completed successfully via simulation.');
        console.log(`[Test] IPFS CID: ${statusRes.body.ipfsCid}`);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log('❌ FAILURE: Polling timed out.');
      }
    }, 2000);

  } catch (err) {
    console.error('[Test] Error:', err.message);
  }
}

runTest();
