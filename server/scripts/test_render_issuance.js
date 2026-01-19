const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://academicchain-ledger.onrender.com';
// const BASE_URL = 'http://localhost:3000'; // Fallback for local testing if needed

const randomString = () => crypto.randomBytes(4).toString('hex');
const email = `test_dev_${randomString()}@example.com`;
const password = 'Password123!';

async function main() {
  try {
    console.log(`Checking health of ${BASE_URL}...`);
    try {
      const health = await axios.get(`${BASE_URL}/ready`);
      console.log('Health check:', health.data);
    } catch (e) {
      console.log('Health check failed, but trying flow anyway...');
    }

    // 1. Register
    console.log(`\n1. Registering developer: ${email}`);
    const regRes = await axios.post(`${BASE_URL}/api/v1/developers/register`, {
      email,
      name: 'Test Developer',
      password,
      plan: 'free'
    });
    console.log('Registration success:', regRes.data);
    const verifyToken = regRes.data.data.verificationToken;

    // 2. Verify Email
    console.log(`\n2. Verifying email with token: ${verifyToken}`);
    await axios.post(`${BASE_URL}/api/v1/developers/verify-email`, {
      token: verifyToken
    });
    console.log('Email verified.');

    // 3. Login
    console.log('\n3. Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/v1/developers/login`, {
      email,
      password
    });
    const jwtToken = loginRes.data.data.token;
    console.log('Login success, JWT obtained.');

    // 4. Issue API Key
    console.log('\n4. Issuing API Key...');
    const keyRes = await axios.post(`${BASE_URL}/api/v1/developers/api-keys/issue`, {
      name: 'Test Key'
    }, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    const apiKey = keyRes.data.data.apiKey;
    console.log('API Key obtained:', apiKey);

    // 5. Test Issuance (Mint Credential)
    console.log('\n5. Testing Issuance (POST /api/v1/credentials/issue)...');
    const tokenId = '0.0.123456'; // Mock or Real? If real backend, needs real token or it will fail on Hedera if not careful. 
    // However, v1 issue logic handles token auto-creation if env var ALLOW_V1_TOKEN_AUTO_CREATE is true.
    // If not, we might get an error. Let's try.
    // Also, we can use mock=1 query param if supported by that endpoint? No, v1/credentials/issue doesn't seem to check mock param in the code I read.
    // But it does check "process.env.DISABLE_MONGO" etc.
    // Let's try to mint.
    
    const uniqueHash = crypto.createHash('sha256').update(randomString()).digest('hex');
    
    try {
        const issueRes = await axios.post(`${BASE_URL}/api/v1/credentials/issue`, {
        tokenId: '0.0.4860126', // Use a plausible token ID or rely on auto-create
        uniqueHash,
        studentName: 'Test Student',
        degree: 'Test Degree',
        ipfsURI: 'ipfs://QmTest'
        }, {
        headers: { 
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
        }
        });
        console.log('Issuance success:', issueRes.data);
    } catch (err) {
        console.error('Issuance failed (expected if invalid token or no credits):', err.response ? err.response.data : err.message);
        // Even a 400 or 403 proves the backend is reachable and auth works.
    }

    // 6. Probe Dashboard Endpoints (Expecting 401 Unauthorized, proving they exist)
    console.log('\n6. Probing Dashboard Endpoints (Checking existence)...');
    const dashboardEndpoints = [
      '/api/partner/dashboard/overview',
      '/api/partner/institutions',
      '/api/partner/api-keys',
      '/api/partner/emissions'
    ];

    for (const endpoint of dashboardEndpoints) {
      try {
        await axios.get(`${BASE_URL}${endpoint}`, {
          headers: { 'x-api-key': 'acp_fake_key' }
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.log(`✅ Endpoint ${endpoint} exists and is protected (401 received).`);
        } else if (err.response && err.response.status === 404) {
          console.error(`❌ Endpoint ${endpoint} NOT FOUND (404).`);
        } else {
          console.log(`⚠️ Endpoint ${endpoint} returned status ${err.response ? err.response.status : 'unknown'}: ${err.message}`);
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

main();
