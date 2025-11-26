const asyncHandler = require('express-async-handler');
const { Credential } = require('../models');
const hederaService = require('../services/hederaServices');
const { isConnected: isMongoConnected } = require('../config/database');

// @desc    Get student credentials
// @route   GET /api/credentials/mine
// @access  Private (Student)
const getStudentCredentials = asyncHandler(async (req, res) => {
  const hederaAccountId = req.user?.hederaAccountId;
  const userId = req.user?._id;
  const disableMongo = process.env.DISABLE_MONGO === '1';
  if (disableMongo || !isMongoConnected()) {
    return res.status(200).json({ credentials: [] });
  }
  const query = hederaAccountId
    ? { $or: [ { studentAccountId: hederaAccountId }, { student: userId } ] }
    : { student: userId };
  const credentials = await Credential.find(query).sort({ createdAt: -1 });
  const enhanced = [];
  for (const c of credentials) {
    let title = '';
    let issuer = '';
    try {
      const v = await hederaService.verifyCredential(c.tokenId, c.serialNumber);
      const attrs = (v.credential?.metadata?.attributes || []);
      title = attrs.find(a => a.trait_type === 'Degree')?.value || '';
      issuer = attrs.find(a => a.trait_type === 'University')?.value || '';
    } catch {}
    enhanced.push({
      id: `${c.tokenId}-${c.serialNumber}`,
      tokenId: c.tokenId,
      serialNumber: c.serialNumber,
      ipfsURI: c.ipfsURI,
      uniqueHash: c.uniqueHash,
      issuer,
      title,
    });
  }
  res.status(200).json({ credentials: enhanced });
});

module.exports = { getStudentCredentials };
