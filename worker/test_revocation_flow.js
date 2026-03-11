import fetch from 'node-fetch';

const API_URL = 'http://127.0.0.1:8787';

async function runTest() {
  console.log('🚀 Starting Revocation Flow Test');

  // 0. Health Check
  try {
      const healthRes = await fetch(`${API_URL}/`);
      const healthText = await healthRes.text();
      console.log('✅ Health Check:', healthText);
  } catch (e) {
      console.error('❌ Health Check Failed:', e.message);
      return;
  }

  // 1. Issue Credential
  /*
  const issuePayload = {
    student_name: "Revocation Test Student " + Date.now(),
    course_name: "Revocation 101",
    graduation_date: "2023-01-01",
    institution_id: "inst-test",
    pdf_base64: "base64mock" // To ensure IPFS upload
  };

  console.log('1️⃣  Issuing Credential...');
  let credentialId;
  let cid;

  try {
    const issueRes = await fetch(`${API_URL}/api/creators/issue-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuePayload)
    });

    const issueData = await issueRes.json();
    console.log('   Issue Response:', JSON.stringify(issueData, null, 2));

    if (!issueData.success) {
      console.error('❌ Issuance Failed');
      return;
    }

    cid = issueData.ipfs_status?.cid || issueData.data?.ipfs?.cid;
    credentialId = issueData.mongo_status?.id;

    if (!credentialId) {
        console.warn('⚠️ No ID returned from issuance. Cannot test ID-based revocation fully.');
    }

    console.log(`   ✅ Issued. ID: ${credentialId}, CID: ${cid}`);
  } catch (e) {
      console.error('❌ Issuance Error:', e);
      return;
  }
  */
  console.log('1️⃣  Skipping Issuance (Mock Mode)');
  let credentialId = 'mock-cert-id-' + Date.now();
  let cid = 'bafy-mock-cid-' + Date.now();
  
  console.log('DEBUG: Step 1.5 - Setup done');

  // 2. Revoke Credential
  console.log('\n2️⃣  Revoking Credential...');
  try {
    // Test revocation by ID (if available) without CID, to test lookup
    const revokePayload = {
      cid: cid, // Uncommented to test happy path
      certificateId: credentialId || 'mock-id-if-missing',
      reason: "Testing revocation endpoint (lookup CID)"
    };
    
    if (!credentialId) {
        // Fallback to CID if no ID
        // revokePayload.cid = cid;
        revokePayload.certificateId = undefined; 
        console.log('   Using CID for revocation (ID missing)');
    } else {
        console.log('   Using ID + CID for revocation (Testing Happy Path)');
    }

    const revokeRes = await fetch(`${API_URL}/api/creators/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revokePayload)
    });

    const revokeData = await revokeRes.json();
    console.log('   Revoke Response:', JSON.stringify(revokeData, null, 2));

    if (revokeData.success) {
      console.log('✅ Revocation Successful');
      
      // Check individual components
      if (revokeData.data.filecoin?.success) {
         console.log('   Filecoin Deletion: SUCCESS');
      } else {
         console.log('   Filecoin Deletion: ' + (revokeData.data.filecoin?.message || revokeData.data.filecoin?.error || 'SKIPPED/FAILED'));
      }
      
      if (revokeData.data.hedera?.success) {
         console.log('   Hedera Revocation: SUCCESS');
      } else {
         console.log('   Hedera Revocation: ' + (revokeData.data.hedera?.error || 'FAILED'));
      }

      if (revokeData.data.d1?.success) {
        console.log('   D1 Update: SUCCESS');
      } else {
        console.log('   D1 Update: ' + (revokeData.data.d1?.error || 'FAILED/SKIPPED'));
      }

    } else {
      console.error('❌ Revocation Failed:', JSON.stringify(revokeData, null, 2));
    }

  } catch (e) {
      console.error('❌ Revocation Error:', e);
  }
}

runTest().catch(console.error);
