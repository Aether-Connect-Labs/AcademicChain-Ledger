const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const UNI_EMAIL = 'uni_test_seq@test.com';
const UNI_PASS = 'password123';
const UNI_NAME = 'Sequential Test Uni';

async function main() {
  try {
    let uniToken;
    console.log('1. Attempting login...');
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: UNI_EMAIL,
            password: UNI_PASS
        });
        uniToken = res.data.token;
        console.log('   Login successful.');
    } catch (e) {
        console.log('   Login failed, attempting registration...');
        
        // Get Admin Token
        try {
            const adminRes = await axios.post(`${BASE_URL}/auth/google/mock`);
            const adminToken = adminRes.data.token;
            
            // Register University
            const regRes = await axios.post(`${BASE_URL}/auth/institutions/register`, {
                email: UNI_EMAIL,
                password: UNI_PASS,
                name: UNI_NAME,
                universityName: UNI_NAME
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            uniToken = regRes.data.token;
            console.log('   Registration successful.');
        } catch (regError) {
             console.error('Registration failed:', regError.response ? regError.response.data : regError.message);
             process.exit(1);
        }
    }

    const headers = { Authorization: `Bearer ${uniToken}` };

    console.log('2. Creating Token (Class)...');
    const tokenSymbol = `SEQ${Math.floor(Math.random()*1000)}`;
    const tokenRes = await axios.post(`${BASE_URL}/universities/create-token`, {
        tokenName: 'Sequential Credential',
        tokenSymbol: tokenSymbol
    }, { headers });
    const tokenId = tokenRes.data.data.tokenId;
    console.log(`   Token Created: ${tokenId}`);

    console.log('3. Issuing Credential (triggering XRP/Algo)...');
    const uniqueHash = `hash-${Date.now()}`;
    const issueRes = await axios.post(`${BASE_URL}/universities/issue-credential`, {
        tokenId: tokenId,
        uniqueHash: uniqueHash,
        ipfsURI: 'ipfs://QmTest',
        studentName: 'Juan Perez',
        degree: 'Master of Chains'
    }, { headers });
    
    const { nftId, mintTxId, xrpTxHash, algoTxId } = issueRes.data.data;
    console.log(`   Issuance Complete!`);
    console.log(`   NFT ID: ${nftId}`);
    console.log(`   Mint Tx: ${mintTxId}`);
    console.log(`   XRP Tx Hash: ${xrpTxHash}`);
    console.log(`   Algo Tx ID: ${algoTxId}`);

    if (!xrpTxHash || !algoTxId) {
        console.error('❌ FAILED: Missing External Proofs in Issue Response');
    } else {
        console.log('✅ SUCCESS: External Proofs returned in Issue Response');
    }

    console.log('4. Verifying Credential...');
    const [tId, serial] = nftId.split('-');
    const verifyRes = await axios.get(`${BASE_URL}/verification/verify/${tId}/${serial}`);
    
    const data = verifyRes.data.data;
    console.log('   Verification Data:', JSON.stringify(data, null, 2));

    const hasXrp = data.xrpAnchor && data.xrpAnchor.xrpTxHash === xrpTxHash;
    const hasAlgo = data.algorandAnchor && data.algorandAnchor.algoTxId === algoTxId;
    
    if (hasXrp && hasAlgo) {
        console.log('✅✅✅ TEST PASSED: All proofs verified and linked!');
    } else {
        console.error('❌ TEST FAILED: Verification data missing proofs.');
        if (!hasXrp) console.error('   Missing XRP in verification.');
        if (!hasAlgo) console.error('   Missing Algo in verification.');
    }

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}

main();
