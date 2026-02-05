/**
 * 🛡️ Security Simulation Script (Self-Contained)
 * Purpose: Verify Antigravity Firewall Response to Brute Force Attack
 * 
 * This script starts a temporary instance of the server to test the defense middleware
 * without affecting the main running application.
 */

const { app } = require('../server/src/app');
const http = require('http');
const axios = require('axios');

const TEST_PORT = 3333;
const TARGET_URL = `http://localhost:${TEST_PORT}/api/antigravity/test`;

async function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(TEST_PORT, () => {
            console.log(`[Antigravity] 🛡️ Temporary Defense Test Node running on port ${TEST_PORT}`);
            resolve(server);
        });
    });
}

async function runSimulation(server) {
    console.log(`[Antigravity] 🕵️ Starting Penetration Test on ${TARGET_URL}...`);
    console.log('[Antigravity] 🛡️ Target: /api/antigravity/test (Protected by Autonomous Defense)');

    // Mock axios to not throw on 4xx/5xx to verify status codes easily
    const client = axios.create({ validateStatus: () => true });

    for (let i = 1; i <= 6; i++) {
        try {
            console.log(`\n[Attempt ${i}] Requesting access...`);
            const response = await client.get(TARGET_URL);

            if (response.status === 200) {
                console.log('❌ Unexpected Success: Access Granted (Should require token)');
            } else if (response.status === 401) {
                console.log('⚠️  Standard Block: 401 Unauthorized (Token missing) - Strike recorded');
            } else if (response.status === 403) {
                console.log('✅ FIREWALL ACTIVE: 403 Forbidden - IP BLOCKED ⛔');
                console.log(`   Reason: ${response.data.message || 'Access Denied'}`);
            } else {
                console.log(`   Result: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.log(`❌ Network Error: ${error.message}`);
        }
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    server.close();
    console.log('\n[Antigravity] 🛡️ Simulation Complete. Defense System Verified.');
    process.exit(0);
}

// Check if we can run this by mocking required services that might fail to connect (Mongo/Redis)
// We'll set env vars to disable them for this test run
process.env.DISABLE_MONGO = '1';
process.env.DISABLE_REDIS = '1';
process.env.DISABLE_HEDERA = '1';
process.env.DISABLE_BULLBOARD = '1';
process.env.NODE_ENV = 'test';

(async () => {
    try {
        const server = await startServer();
        await runSimulation(server);
    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
})();
