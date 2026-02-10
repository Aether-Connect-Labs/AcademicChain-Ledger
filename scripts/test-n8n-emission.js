// Test script to verify n8n connectivity
// Run with: node scripts/test-n8n-emission.js

// Import dependencies (using CommonJS for script)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration from your .env
const BASE_URL = 'https://n8n-b0be.onrender.com';
const AUTH_KEY = 'acl_live_sec_8f92a3b4';
const WEBHOOK_ID = 'submit-document';

async function testEndpoint(url, method, payload) {
    console.log(`\nTesting ${method} ${url}...`);
    try {
        const options = {
            method: method,
            headers: {
                'X-ACL-AUTH-KEY': AUTH_KEY
            }
        };
        
        if (method === 'POST') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        
        try {
            const json = JSON.parse(text);
            console.log('Response JSON:', JSON.stringify(json, null, 2));
            return { success: response.ok, data: json, status: response.status };
        } catch (e) {
            console.log('Response Text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
            return { success: response.ok, data: text, status: response.status };
        }
    } catch (error) {
        console.error('Connection Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function runDiagnostics() {
    console.log('🚀 Starting n8n Connectivity Diagnostics');
    console.log('----------------------------------------');

    const payload = {
        documentHash: `hash-${Date.now()}`,
        userId: 'test-user-cli',
        metadata: {
            studentName: 'Test Student',
            issueDate: new Date().toISOString()
        },
        issuanceType: 'certificate',
        networks: ['hedera']
    };

    // 1. Test Production POST (Expected)
    const prodUrl = `${BASE_URL}/webhook/${WEBHOOK_ID}`;
    const prodResult = await testEndpoint(prodUrl, 'POST', payload);

    if (prodResult.success) {
        console.log('\n✅ SUCCESS: Production Webhook is working!');
        return;
    }

    // 2. If 404/405, check if it's GET
    if (prodResult.status === 404 || prodResult.status === 405) {
        console.log('\n⚠️  Production POST failed. Testing GET (maybe misconfigured method?)...');
        // Try GET without params first
        await testEndpoint(prodUrl, 'GET', null);
        
        // Try GET with query params
        console.log('\nTesting GET with query params...');
        const queryParams = new URLSearchParams({
            documentHash: payload.documentHash,
            studentName: payload.metadata.studentName
        }).toString();
        await testEndpoint(`${prodUrl}?${queryParams}`, 'GET', null);
    }

    // 3. Test Test Webhook (often works when Production is not active)
    console.log('\n🔍 Testing "webhook-test" URL (works if workflow is saved but not active)...');
    const testUrl = `${BASE_URL}/webhook-test/${WEBHOOK_ID}`;
    const testResult = await testEndpoint(testUrl, 'POST', payload);

    if (testResult.success) {
        console.log('\n✅ SUCCESS: Test Webhook works!');
        console.log('👉 ACTION REQUIRED: The workflow is working in Test mode but not Production.');
        console.log('   Please go to n8n UI, open the workflow, and toggle "Active" to true in the top right corner.');
        return;
    }

    console.log('\n❌ DIAGNOSIS COMPLETE: Unable to connect via standard paths.');
    console.log('Possible causes:');
    console.log('1. The workflow ID "submit-document" might be different on the server.');
    console.log('2. The workflow is not active (for production URL).');
    console.log('3. The server might be down or unreachable.');
}

runDiagnostics();
