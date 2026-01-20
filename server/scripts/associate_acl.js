
require('dotenv').config({ path: 'server/.env' });
const { Client, TokenAssociateTransaction, PrivateKey } = require('@hashgraph/sdk');

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  const aclTokenId = process.env.ACL_TOKEN_ID || '0.0.7560139';

  if (!accountId || !privateKeyStr) {
    console.error('❌ Falta configuración de Hedera');
    return;
  }

  let privateKey;
  try {
    if (privateKeyStr.startsWith('0x')) {
      privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
    } else {
      privateKey = PrivateKey.fromStringED25519(privateKeyStr);
    }
  } catch (e) {
    console.log('⚠️ Error parseando llave, intentando genérico:', e.message);
    privateKey = PrivateKey.fromString(privateKeyStr);
  }

  console.log(`🔌 Conectando a Hedera (${accountId})...`);
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);

  try {
    console.log(`🔗 Asociando Token ACL (${aclTokenId})...`);
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([aclTokenId])
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    console.log(`✅ Asociación exitosa! Status: ${receipt.status}`);
  } catch (error) {
    if (error.message.includes('TOKEN_ALREADY_ASSOCIATED')) {
      console.log('✅ El token ya estaba asociado.');
    } else {
      console.error('❌ Error asociando token:', error.message);
    }
  }
  process.exit(0);
}

main();
