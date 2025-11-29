require('dotenv').config();
const xrpService = require('../services/xrpService');

const run = async () => {
  try {
    process.stdout.write('VERIFICANDO XRP...\n\n');
    await xrpService.connect();
    const status = typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false;
    if (!status) {
      process.stdout.write('XRP no habilitado\n');
      process.exit(1);
    }
    const b = await xrpService.getBalance();
    process.stdout.write(`Red: ${b.network}\n`);
    process.stdout.write(`Dirección: ${b.address}\n`);
    process.stdout.write(`Balance: ${b.balance} XRP\n`);
    process.exit(0);
  } catch (e) {
    process.stdout.write(`Error XRP: ${e.message}\n`);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}