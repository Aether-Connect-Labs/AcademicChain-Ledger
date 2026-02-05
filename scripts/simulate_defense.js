/**
 * 🛡️ Security Simulation Script
 * Purpose: Verify Antigravity Firewall Response to Brute Force Attack
 */

const axios = require('axios');

const TARGET_URL = 'http://localhost:3001/api/antigravity/test';
// const TARGET_URL = 'http://localhost:3000/api/antigravity/test'; // Try port 3000 if 3001 fails (dev vs prod)

async function runSimulation() {
    console.log(`[Antigravity] 🕵️ Starting Penetration Test on ${TARGET_URL}...`);
    console.log('[Antigravity] 🛡️ Target: /api/antigravity/test (Protected by Autonomous Defense)');

    for (let i = 1; i <= 6; i++) {
        try {
            console.log(`\n[Attempt ${i}]Sending request without token...`);
            await axios.get(TARGET_URL);
            console.log('❌ Unexpected Success: firewall failed to block request.');
        } catch (error) {
            if (error.response) {
                console.log(`✅ Response: ${error.response.status} ${error.response.statusText}`);
                console.log(`   Message: ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`❌ Network Error: ${error.message}`);
                // Try port 3000 if connection refused on 3001?
            }
        }
        // Small delay to ensure sequential processing
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

runSimulation();
