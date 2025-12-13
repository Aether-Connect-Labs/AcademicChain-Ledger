require('dotenv').config();
const hederaService = require('../services/hederaServices');

const run = async () => {
  try {
    process.stdout.write('VERIFICANDO HEDERA...\n\n');
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privKey = process.env.HEDERA_PRIVATE_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';
    if (!accountId || !privKey) {
      process.stdout.write('Falta HEDERA_ACCOUNT_ID o HEDERA_PRIVATE_KEY\n');
      process.stdout.write(`HEDERA_NETWORK=${network}\n`);
      process.exit(1);
    }
    await hederaService.connect();
    if (!hederaService.isEnabled()) {
      process.stdout.write('Hedera no habilitado (revise credenciales y red)\n');
      process.stdout.write(`HEDERA_NETWORK=${network}\n`);
      process.exit(1);
    }
    const bal = await hederaService.getAccountBalance(accountId);
    process.stdout.write('Hedera conectado\n');
    process.stdout.write(`Red: ${network}\n`);
    process.stdout.write(`Balance: ${bal.hbars} HBARs\n`);
    process.exit(0);
  } catch (e) {
    process.stdout.write(`Error Hedera: ${e.message}\n`);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}
