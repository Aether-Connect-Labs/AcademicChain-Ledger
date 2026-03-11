
const API_URL = 'http://127.0.0.1:8787';

async function runTest() {
  console.log('🚀 Starting Simple Revocation Test');

  const cid = 'bafy-mock-cid-' + Date.now();
  const credentialId = 'mock-cert-id-' + Date.now();
  
  const revokePayload = {
      cid: cid,
      certificateId: credentialId,
      reason: "Testing simple revocation script"
  };
    
  console.log('   Using ID + CID for revocation:', revokePayload);

  try {
      const revokeRes = await fetch(`${API_URL}/api/creators/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revokePayload)
      });

      console.log('   Status:', revokeRes.status);
      const text = await revokeRes.text();
      console.log('   Response:', text);

      try {
          const data = JSON.parse(text);
          if (data.success) {
              console.log('✅ Revocation Successful');
          } else {
              console.error('❌ Revocation Failed Logic');
          }
      } catch (e) {
          console.error('❌ Failed to parse JSON:', e);
      }

  } catch (e) {
      console.error('❌ Fetch Error:', e);
  }
}

runTest();
