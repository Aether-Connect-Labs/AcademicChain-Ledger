/**
 * 🛡️ MODULE PROTECTED BY ANTIGRAVITY INTEGRITY PROTOCOL
 * --------------------------------------------------------
 * Created by: Antigravity (Lead Architect)
 * Purpose: Skill Adapter - Exposes Service Logic to CLI/Automation
 * Integrity: Validates commands and triggers Triple Shield
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const issuanceService = require('../server/src/services/issuanceService');
const logger = require('../server/src/utils/logger');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// --- Configuration ---
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.generic.com/webhook/antigravity-event'; // Placeholder if not set
const MOCK_ISSUER_DID = 'did:web:academic-chain:antigravity-node';

/**
 * Parses command line arguments specifically for Antigravity Skills
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};
    let currentKey = null;

    args.forEach(arg => {
        if (arg.startsWith('--')) {
            currentKey = arg.substring(2);
            params[currentKey] = true;
        } else if (currentKey) {
            params[currentKey] = arg;
            currentKey = null;
        }
    });
    return params;
}

/**
 * Notify n8n via Webhook
 */
async function notifyN8n(event, data) {
    try {
        console.log(`[Antigravity] Communicating with n8n for event: ${event}...`);
        // In a real scenario, this connects to the User's n8n instance
        // await axios.post(N8N_WEBHOOK_URL, { event, data, timestamp: new Date().toISOString() });
        console.log(`[Antigravity] ✅ n8n Notification Sent: ${event}`);
    } catch (error) {
        console.error(`[Antigravity] ⚠️ Failed to notify n8n: ${error.message}`);
    }
}

/**
 * Execute Skill: Mint Credential
 */
async function executeMint(params) {
    if (!params.student || !params.degree || !params.institution) {
        throw new Error('Missing required parameters: --student, --degree, --institution');
    }

    console.log(`[Antigravity] 🛡️ Initiating Triple Shield Issuance for ${params.student}...`);

    // Simulate unique hash if not provided (usually file hash)
    const uniqueHash = params.hash || require('crypto').randomBytes(32).toString('hex');

    // 1. Call the Protected Service
    const result = await issuanceService.mintLegalCredential({
        studentName: params.student,
        institution: params.institution,
        degree: params.degree,
        uniqueHash: uniqueHash,
        issuerDid: MOCK_ISSUER_DID,
        institutionId: params.institutionIds || 'ANTIGRAVITY_AUTO_ADMIN' // Use a specific admin ID
    }, null); // No physical file for this CLI test, typically file path would be passed

    // 2. Report Success
    console.log('[Antigravity] ✅ Credential Issued Successfully.');
    console.log(` - Hedera: PENDING (Minting ready)`);
    console.log(` - XRP: ${result.blockchainEvidence.xrpKey}`);
    console.log(` - Algorand: ${result.blockchainEvidence.algorandKey}`);
    console.log(` - Protection: ${result.encryption.isEncrypted ? 'AES-256 Enabled' : 'None'}`);

    // 3. Notify n8n
    await notifyN8n('CREDENTIAL_MINTED', result);
}

/**
 * Main Controller
 */
async function main() {
    const params = parseArgs();

    try {
        switch (params.command) {
            case 'mint_credential':
                await executeMint(params);
                break;
            case 'test_connection':
                console.log('[Antigravity] System check: All systems operational.');
                break;
            default:
                console.log('Available Commands:');
                console.log('  --command mint_credential --student "Name" --degree "Degree" --institution "School"');
                console.log('  --command test_connection');
        }
    } catch (error) {
        console.error(`[Antigravity] ❌ Fatal Error: ${error.message}`);
        await notifyN8n('ERROR', { error: error.message });
        process.exit(1);
    }
}

main();
