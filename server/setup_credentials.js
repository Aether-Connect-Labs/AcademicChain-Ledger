const fs = require('fs');
const path = require('path');
const xrpl = require('xrpl');
const algosdk = require('algosdk');
const axios = require('axios');

const envPath = path.join(__dirname, '.env');

async function setup() {
  console.log('🔄 Setting up credentials...');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // --- XRP SETUP ---
  console.log('Generating XRP Wallet...');
  const wallet = xrpl.Wallet.generate();
  console.log(`Address: ${wallet.address}`);
  
  console.log('Requesting funds from XRP Testnet Faucet...');
  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
  await client.connect();
  
  try {
    const fundResult = await client.fundWallet(wallet);
    console.log(`XRP Wallet Funded! Balance: ${fundResult.balance} XRP`);
  } catch (e) {
    console.error('Failed to fund XRP wallet automatically:', e.message);
    // Fallback: try manual faucet request if needed, or just proceed
  }
  await client.disconnect();

  // Update .env for XRP
  updateEnv('ENABLE_XRP_ANCHOR', '1');
  updateEnv('XRPL_SEED', wallet.seed);
  updateEnv('XRPL_NETWORK', 'testnet');

  // --- ALGORAND SETUP ---
  console.log('Generating Algorand Wallet...');
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log(`Address: ${account.addr}`);
  console.log('Mnemonic generated.');
  
  // Note: Algorand needs funding to send txs. We can't easily auto-fund without a specific faucet API key or captcha.
  // However, we will set it up so it *tries*.
  updateEnv('ENABLE_ALGORAND', '1');
  updateEnv('ALGORAND_ENABLED', 'true');
  updateEnv('ALGORAND_MNEMONIC', mnemonic);
  updateEnv('ALGORAND_NETWORK', 'testnet');
  updateEnv('ALGORAND_SERVER', 'https://testnet-api.algonode.cloud');
  updateEnv('ALGORAND_PORT', '443');

  // --- HEDERA CHECK ---
  if (!envContent.includes('HEDERA_ACCOUNT_ID') || envContent.includes('HEDERA_ACCOUNT_ID=0.0.12345')) {
      console.warn('⚠️  No valid HEDERA_ACCOUNT_ID found. Hedera transactions will likely fail or be mocked.');
      // We can't auto-generate Hedera accounts easily.
  }

  // Write .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env updated successfully.');
  
  function updateEnv(key, value) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
}

setup().catch(console.error);
