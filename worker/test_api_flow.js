
// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://127.0.0.1:8787';

async function runTest() {
  console.log('🚀 Starting API Flow Test: Issuance -> Revocation');

  // 1. Issue Credential
  const issuePayload = {
    studentName: "Test Student " + Date.now(),
    credentialType: "Certification",
    course: "Blockchain 101"
  };

  console.log('1️⃣  Issuing Credential...');
  let txId, studentId, cid;

  try {
    const issueRes = await fetch(`${API_URL}/api/creators/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuePayload)
    });

    const issueData = await issueRes.json();
    console.log('   Response:', issueData);

    if (!issueData.success) {
      console.error('❌ Issuance Failed');
      return;
    }

    txId = issueData.data.txId;
    studentId = issueData.data.studentId || 'student-' + Date.now(); // Fallback if not returned
    cid = issueData.data.ipfs?.cid;
    
    // If studentId is not in data, we might need to extract it or use a mock one if the endpoint generates it
    // The endpoint generates 'student-timestamp' if not provided?
    // Let's check the endpoint logic. It uses 'student-123' if not provided? 
    // Actually, looking at previous code, it uses provided studentId or generates one.
    // In my payload I didn't provide studentId.
    
  } catch (e) {
    console.error('❌ Issuance Error:', e);
    return;
  }

  console.log(`✅ Issued. TxID: ${txId}, CID: ${cid}`);

  // 2. Revoke Credential
  console.log('\n2️⃣  Revoking Credential...');
  
  const revokePayload = {
    txId: txId, // Using txId as the identifier
    reason: "Test Revocation Script"
  };

  try {
    const revokeRes = await fetch(`${API_URL}/api/creators/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revokePayload)
    });

    const revokeData = await revokeRes.json();
    console.log('   Response:', revokeData);

    if (revokeData.success) {
      console.log('✅ Revocation Successful');
      if (revokeData.data.filecoin?.success) {
         console.log('   Filecoin Deletion: SUCCESS');
      } else {
         console.log('   Filecoin Deletion: ' + (revokeData.data.filecoin?.error || 'SKIPPED/FAILED'));
      }
      if (revokeData.data.hedera?.success) {
         console.log('   Hedera Revocation: SUCCESS (' + revokeData.data.hedera.txHash + ')');
      } else {
         console.log('   Hedera Revocation: ' + (revokeData.data.hedera?.error || 'FAILED'));
      }
    } else {
      console.error('❌ Revocation Failed');
    }

  } catch (e) {
    console.error('❌ Revocation Error:', e);
  }
}

runTest();
