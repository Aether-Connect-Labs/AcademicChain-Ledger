const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const tokenId = '0.0.7696316';
const serialNumber = '1';

async function check() {
    try {
        console.log(`Querying ${BASE_URL}/api/verification/credential-history/${tokenId}/${serialNumber}...`);
        const res = await axios.get(`${BASE_URL}/api/verification/credential-history/${tokenId}/${serialNumber}`);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Data:', e.response.data);
        }
    }
}

check();