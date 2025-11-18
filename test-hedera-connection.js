const { Client, AccountBalanceQuery } = require('@hashgraph/sdk');
const dotenv = require('dotenv');
const path = require('path');

// Cargar las variables de entorno desde el archivo .env en la carpeta del servidor
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const myAccountId = process.env.HEDERA_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;
const hederaNetwork = process.env.HEDERA_NETWORK;

async function testHederaConnection() {
  console.log('🧪 Iniciando prueba de conexión a Hedera...');

  if (!myAccountId || !myPrivateKey) {
    console.error('❌ Error: Las variables HEDERA_ACCOUNT_ID y HEDERA_PRIVATE_KEY no están definidas.');
    console.log('Asegúrate de que tu archivo "server/.env" contenga las credenciales correctas.');
    return;
  }

  console.log(`- Conectando a la red: ${hederaNetwork || 'mainnet'}`);
  console.log(`- Usando Account ID: ${myAccountId}`);

  let client;
  try {
    // Crear el cliente para la red especificada (testnet o mainnet)
    client = hederaNetwork === 'testnet' ? Client.forTestnet() : Client.forMainnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Crear la consulta de saldo
    const query = new AccountBalanceQuery().setAccountId(myAccountId);

    // Ejecutar la consulta
    const accountBalance = await query.execute(client);

    console.log('✅ ¡Conexión exitosa!');
    console.log(`- El saldo de la cuenta es: ${accountBalance.hbars.toString()}`);
  } catch (error) {
    console.error('❌ Falló la prueba de conexión a Hedera:');
    console.error(`- Razón: ${error.message}`);
    console.error('- Por favor, verifica que tu HEDERA_ACCOUNT_ID y HEDERA_PRIVATE_KEY sean correctos y que la cuenta exista en la red de prueba (testnet).');
  } finally {
    if (client) {
      client.close();
    }
  }
}

testHederaConnection();