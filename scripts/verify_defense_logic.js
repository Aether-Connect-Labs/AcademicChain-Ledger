/**
 * 🛡️ Antigravity Defense Verification (Logic Test)
 * Purpose: Verify Firewall Service Logic works as designed
 */

const firewallService = require('../server/src/services/firewallService');
const antigravityDefense = require('../server/src/middleware/antigravityDefense');

// Mock Express Objects
const mockReq = (ip, token) => ({
    ip,
    headers: { 'x-antigravity-token': token },
    originalUrl: '/api/antigravity/test'
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const mockNext = () => {
    console.log('✅ Access Granted (Middleware passed)');
};

async function runTest() {
    console.log('[Antigravity] 🛡️ Starting Logic Verification...');
    const TEST_IP = '192.168.1.66'; // Simulation IP

    // 1. Valid Request (Test)
    console.log('\n--- Test 1: Valid Token ---');
    // Generate a valid token using authService or just mock the verification? 
    // Since middleware verifies using jwt, we'll skip valid token generation for this strict firewall test
    // and focus on blocking logic.

    // 2. Attack Simulation
    console.log(`\n--- Test 2: Simulating Attack from ${TEST_IP} ---`);
    for (let i = 1; i <= 5; i++) {
        const req = mockReq(TEST_IP, null); // No token
        const res = mockRes();

        console.log(`[Attempt ${i}] Incoming request...`);

        await antigravityDefense(req, res, mockNext);

        if (res.statusCode === 403 && res.data.error === 'Access Denied') {
            console.log(`⛔ BLOCKED: ${res.data.message}`);
            break;
        } else if (res.statusCode === 401) {
            console.log(`⚠️  Rejected: ${res.data.message}`);
        }

        // Check blocks internally
        if (firewallService.isBlocked(TEST_IP)) {
            console.log(`[System Check] IP ${TEST_IP} is now in BLOCKED list.`);
        }
    }

    // 3. Verify Final State
    const isBlocked = firewallService.isBlocked(TEST_IP);
    console.log(`\n[Result] IP ${TEST_IP} Block Status: ${isBlocked ? '⛔ BLOCKED' : '✅ ALLOWED'}`);
}

runTest();
