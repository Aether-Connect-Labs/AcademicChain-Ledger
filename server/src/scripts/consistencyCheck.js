require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const { Credential, XrpAnchor } = require('../models');

const run = async () => {
  await connectDB();
  const creds = await Credential.find({}).select('tokenId serialNumber uniqueHash').lean();
  let missingAnchors = 0;
  for (const c of creds) {
    const a = await XrpAnchor.findOne({ hederaTokenId: c.tokenId, serialNumber: c.serialNumber });
    if (!a) missingAnchors++;
  }
  const dupUnique = await Credential.aggregate([{ $group: { _id: '$uniqueHash', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]);
  process.stdout.write(JSON.stringify({ totalCredentials: creds.length, missingAnchors, duplicateUniqueHashes: dupUnique.length }) + '\n');
  await mongoose.connection.close();
  process.exit(0);
};

if (require.main === module) {
  run();
}