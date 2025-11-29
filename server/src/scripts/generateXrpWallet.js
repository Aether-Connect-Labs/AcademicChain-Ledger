const xrpl = require('xrpl');

const wallet = xrpl.Wallet.generate();
process.stdout.write('🔑 XRP WALLET:\n');
process.stdout.write(`Address: ${wallet.address}\n`);
process.stdout.write(`Seed: ${wallet.seed}\n`);
process.stdout.write('\n📝 Agrega esto a Render:\n');
process.stdout.write(`XRPL_SEED=${wallet.seed}\n`);