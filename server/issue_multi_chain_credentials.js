require('dotenv').config();
// const { connectDB } = require('./src/config/database'); // DB not running locally
const hederaService = require('./src/services/hederaServices');
const xrpService = require('./src/services/xrpService');
const algorandService = require('./src/services/algorandService');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');

async function main() {
  console.log('Initializing services...');
  
  // await connectDB(); // Skipped

  // Initialize Services
  try {
    if (!process.env.HEDERA_ACCOUNT_ID) {
        console.warn('\n⚠️ WARNING: HEDERA_ACCOUNT_ID not set in .env. Hedera transactions will be SIMULATED and not visible on HashScan.');
        console.warn('To enable real Hedera minting, please provide HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY.\n');
    }
    
    const hederaConnected = await hederaService.connect();
    if (!hederaConnected) console.warn('Hedera not connected');
    
    await xrpService.connect();
    if (xrpService.isEnabled()) console.log('XRP Connected');
    
    await algorandService.connect();
    if (algorandService.isEnabled()) {
        console.log('Algorand Connected');
        // Try to fund Algorand if balance is 0
        try {
             const accountInfo = await algorandService.client.accountInformation(algorandService.address).do();
             if (accountInfo.amount < 100000) {
                 console.log('Algorand balance low, attempting to fund via dispenser...');
                 await axios.post('https://dispenser.testnet.aws.algodev.network/dispense', {
                     receiver: algorandService.address,
                     amount: 10000000,
                     assetType: "ALGO"
                 });
                 console.log('Algorand funded successfully!');
             }
        } catch(e) {
            console.warn('Could not auto-fund Algorand (Dispenser might be protected or down). Tx may fail:', e.message);
        }
    }
  } catch (e) {
    console.error('Error connecting services:', e);
  }

  // Create a Token if needed (or use a placeholder)
  // For this script, we'll create a new token for the batch
  let tokenId;
  try {
    console.log('Creating new Hedera Token for this batch...');
    const tokenResult = await hederaService.createAcademicToken({
      tokenName: 'MultiChain Credential Batch',
      tokenSymbol: 'MC-BATCH',
    });
    tokenId = tokenResult.tokenId;
    console.log(`Token Created: ${tokenId}`);
  } catch (e) {
    console.error('Failed to create token:', e);
    // Fallback or exit
    if (!process.env.HEDERA_ACCOUNT_ID) {
        console.log("Simulating Token ID since Hedera is not configured.");
        tokenId = "0.0.123456";
    } else {
        return;
    }
  }

  // Issue 3 Credentials
  const students = [
    { name: 'Juan Perez', degree: 'Computer Science', id: 'S001' },
    { name: 'Maria Garcia', degree: 'Physics', id: 'S002' },
    { name: 'Carlos Lopez', degree: 'Mathematics', id: 'S003' }
  ];

  for (const student of students) {
    console.log(`\nProcessing credential for ${student.name}...`);
    const uniqueHash = crypto.createHash('sha256').update(uuidv4()).digest('hex');
    
    // 1. Anchor on XRP
    let xrpTxHash = null;
    try {
      console.log('Anchoring on XRP...');
      const xrpRes = await xrpService.anchor({
        certificateHash: uniqueHash,
        hederaTokenId: tokenId,
        // serialNumber not known yet
        timestamp: new Date().toISOString()
      });
      xrpTxHash = xrpRes.xrpTxHash || xrpRes.hash; // Adjust based on return
      console.log(`XRP Anchor: ${xrpTxHash}`);
    } catch (e) {
      console.error('XRP Anchor failed:', e.message);
    }

    // 2. Anchor on Algorand
    let algoTxId = null;
    try {
      const accountInfo = await algorandService.client.accountInformation(algorandService.address).do();
      if (accountInfo.amount < 2000) { // Min fee is 1000 microAlgos
         console.log('Skipping Algorand anchor due to insufficient funds. Please fund: ' + algorandService.address);
      } else {
          console.log('Anchoring on Algorand...');
          const algoRes = await algorandService.anchor({
            certificateHash: uniqueHash,
            hederaTokenId: tokenId,
            serialNumber: student.id, // using ID as dummy serial for anchor data
            timestamp: new Date().toISOString()
          });
          algoTxId = algoRes.txId || algoRes.algoTxId;
          console.log(`Algorand Anchor: ${algoTxId}`);
      }
    } catch (e) {
      console.error('Algorand Anchor failed:', e.message);
    }

    // 3. Mint on Hedera (Mock or Real)
    console.log('Minting on Hedera...');
    let mintTxId = null;
    let serial = null;
    try {
        // If we are mocking, we can't really mint on-chain without keys.
        // We will simulate a successful mint.
        if (!process.env.HEDERA_ACCOUNT_ID) {
            serial = Math.floor(Math.random() * 100000);
            // Format: 0.0.ACCOUNT_ID@SECONDS.NANOS
            const now = Date.now();
            const seconds = Math.floor(now / 1000);
            const nanos = (now % 1000) * 1000000;
            mintTxId = `0.0.12345@${seconds}.${nanos}`;
            console.log(`Hedera Mint Serial: ${serial} (Simulated)`);
            console.log(`Hedera Tx ID: ${mintTxId} (Simulated)`);
        } else {
             const mintRes = await hederaService.mintAcademicCredential(tokenId, {
                uniqueHash,
                studentName: student.name,
                degree: student.degree,
                university: 'Academic Chain University',
                xrpTxHash,
                algoTxId
             });
             mintTxId = mintRes.transactionId;
             serial = mintRes.serialNumber;
             console.log(`Hedera Mint Serial: ${serial}`);
             console.log(`Hedera Tx ID: ${mintTxId}`);
        }
    } catch (e) {
        console.error('Hedera Mint failed:', e.message);
    }

    // Summary
    console.log('--- Credential Summary ---');
    console.log(`Student: ${student.name}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Serial: ${serial}`);
    console.log(`HBAR Tx: ${mintTxId}`);
    if (xrpTxHash) console.log(`XRP Tx: ${xrpTxHash}`);
    if (algoTxId) console.log(`Algorand Tx: ${algoTxId}`);
    
    // HashScan Link
    const hederaNetwork = process.env.HEDERA_NETWORK || 'testnet';
    const hashscanUrl = `https://hashscan.io/${hederaNetwork}/transaction/${mintTxId}`;
    console.log(`HashScan: ${hashscanUrl}`);
    
    // XRP Link
    if (xrpTxHash) console.log(`XRPL Explorer: https://testnet.xrpl.org/transactions/${xrpTxHash}`);

    // Algorand Link
    if (algoTxId) console.log(`AlgoExplorer: https://testnet.explorer.perawallet.app/tx/${algoTxId}/`);
  }
}

main().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(e => {
    console.error("Fatal error:", e);
    process.exit(1);
});
