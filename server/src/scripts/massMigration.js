require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const { Credential } = require('../models');
const xrpService = require('../services/xrpService');

const run = async () => {
  await connectDB();
  await xrpService.connect();
  const dry = process.env.MIGRATION_DRY_RUN !== '0';
  const batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE || '50', 10);
  const delayMs = parseInt(process.env.MIGRATION_DELAY_MS || '1000', 10);
  const creds = await Credential.find({}).select('tokenId serialNumber uniqueHash').lean();
  let anchored = 0;
  for (let i = 0; i < creds.length; i += batchSize) {
    const batch = creds.slice(i, i + batchSize);
    if (!dry) {
      await Promise.all(batch.map(c => xrpService.anchor({ certificateHash: c.uniqueHash, hederaTokenId: c.tokenId, serialNumber: c.serialNumber, timestamp: new Date().toISOString() })));
    }
    anchored += batch.length;
    await new Promise(r => setTimeout(r, delayMs));
  }
  process.stdout.write(JSON.stringify({ total: creds.length, processed: anchored, dryRun: dry }) + '\n');
  await mongoose.connection.close();
  process.exit(0);
};

if (require.main === module) {
  run();
}