const hederaService = require('../src/services/hederaServices');
const logger = require('../src/utils/logger');
require('dotenv').config();

const tokenId = '0.0.7696316';
const serialNumber = '1';

async function check() {
    try {
        console.log(`Verifying ${tokenId} serial ${serialNumber}...`);
        // Ensure connection
        await hederaService.connect();
        
        const result = await hederaService.verifyCredential(tokenId, serialNumber);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();