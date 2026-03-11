// import fetch from 'node-fetch'; // Native fetch in Node 18+

const API_HOST = '127.0.0.1';
const API_PORT = 8787;
const API_URL = `http://${API_HOST}:${API_PORT}`;

process.on('exit', (code) => console.log(`[PROCESS] Exiting with code ${code}`));
process.on('uncaughtException', (err) => console.error('[PROCESS] Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('[PROCESS] Unhandled Rejection:', reason));

async function runTest() {
    console.log(`🚀 Starting University Revocation Flow Test (Node ${process.version})`);
    
    // Check fetch availability
    const fetchFn = global.fetch || fetch;
    console.log('   Fetch implementation:', typeof fetchFn);

    if (typeof fetchFn !== 'function') {
        console.error('❌ Fetch is not a function!');
        return;
    }

    // 0. Health Check
    console.log('0️⃣  Checking Server Health...');
    try {
        const healthRes = await fetchFn(`${API_URL}/`, { signal: AbortSignal.timeout(5000) });
        if (healthRes.ok) {
            console.log('✅ Server is UP:', await healthRes.text());
        } else {
            console.error('❌ Server returned:', healthRes.status);
            return;
        }
    } catch (e) {
        console.error('❌ Server Health Check Failed:', e.message);
        console.error('   Make sure `node worker/start-dev.js` is running.');
        return;
    }

    // 1. Issue
    console.log('1️⃣  Issuing mock credential...');
    const issuePayload = {
        student_name: "Test Student " + Date.now(),
        course_name: "Test Course",
        graduation_date: new Date().toISOString().split('T')[0],
        institution_id: "inst-test",
        pdf_base64: "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlL3BhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlL2ZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9i2CAgJS9jb250ZW50Cjw8IC9MZW5ndGggMjIgPj4Kc3RyZWFtCkJVCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQwNQolJUVPRgo=" 
    };

    try {
        console.log(`   [FETCH] POST ${API_URL}/api/creators/issue-full`);
        const issueRes = await fetchFn(`${API_URL}/api/creators/issue-full`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issuePayload),
            signal: AbortSignal.timeout(30000) // 30s timeout
        });
        
        console.log(`   [FETCH] Response Status: ${issueRes.status}`);
        const issueText = await issueRes.text();
        console.log(`   [FETCH] Response Body Length: ${issueText.length}`);

        let issueData;
        try {
            issueData = JSON.parse(issueText);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
            console.log('   Body:', issueText);
            return;
        }

        let credentialId = issueData.mongo_status?.id;
        // Also check if id is in data.id (D1 format sometimes)
        if (!credentialId && issueData.data && issueData.data.id) {
             credentialId = issueData.data.id;
        }

        // Print full response if ID missing
        if (!credentialId) {
            console.log('   [DEBUG] Full Response:', JSON.stringify(issueData, null, 2));
        }

        console.log('   Credential ID:', credentialId || 'UNKNOWN');

        if (!credentialId) {
            console.error('❌ Could not obtain Credential ID. Aborting.');
            return;
        }

        // 2. Revoke
        console.log(`2️⃣  Revoking credential ${credentialId}...`);
        const revokePayload = {
            certificateId: credentialId,
            reason: "University Revocation Test Script via node-fetch"
        };

        const revokeRes = await fetchFn(`${API_URL}/api/creators/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(revokePayload),
            signal: AbortSignal.timeout(10000)
        });

        console.log(`   [FETCH] Revoke Status: ${revokeRes.status}`);
        const revokeData = await revokeRes.json();
        console.log('   Revoke Response:', JSON.stringify(revokeData, null, 2));

        if (revokeRes.status === 200 && revokeData.success) {
            console.log('✅ University Revocation Successful');
            console.log('   Hedera:', revokeData.data?.hedera);
            console.log('   Filecoin:', revokeData.data?.filecoin);
        } else {
            console.error('❌ University Revocation Failed');
        }

    } catch (e) {
        console.error('❌ Request Failed:', e);
    }
}

runTest();