const http = require('http');

const studentId = 'STU-COMPLETE-' + Math.floor(Math.random() * 1000);
const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    console.log(`Starting test for ${studentId}...`);

    // 1. Certify
    console.log('1. Sending certification request...');
    const certifyRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/certify', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        studentName: 'Test Student', studentId, courseName: 'Test Course',
        institutionId: 'INST-001', graduationDate: '2024-01-01'
    });
    console.log('Certify Response:', certifyRes.body);

    // 2. Check Status (Processing)
    console.log('2. Checking status (expect processing)...');
    const statusRes1 = await request({
        hostname: 'localhost', port: 3000, path: `/api/student/${studentId}/status`, method: 'GET'
    });
    console.log('Status:', statusRes1.body.status);

    // 3. Callback
    console.log('3. Simulating n8n callback...');
    const callbackRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/webhook/n8n-callback', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-n8n-secret': 'academicchain-secret-key-2024' }
    }, {
        studentId, ipfsCid: cid, status: 'completed', txHash: '0x123'
    });
    console.log('Callback Response:', callbackRes.body);

    // 4. Check Status (Completed)
    console.log('4. Checking status (expect completed)...');
    const statusRes2 = await request({
        hostname: 'localhost', port: 3000, path: `/api/student/${studentId}/status`, method: 'GET'
    });
    console.log('Final Status:', statusRes2.body.status, 'CID:', statusRes2.body.ipfsCid);
}

run().catch(console.error);
