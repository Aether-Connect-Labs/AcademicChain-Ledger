const asyncHandler = require('express-async-handler');
const hederaService = require('../services/hederaServices');
const { Token, User } = require('../models');

module.exports = asyncHandler(async function associationGuard(req, res, next) {
  const tokenId = String(req.body?.tokenId || '').trim();
  if (!tokenId) return res.status(400).json({ success: false, message: 'tokenId requerido' });
  const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  const disableMongo = process.env.DISABLE_MONGO === '1';
  if (isTest || disableMongo) return next();
  if (process.env.DEMO_MODE === 'true') {
     // If demo mode, try to find token but don't block strictly on ACL if it's the demo partner
     if (req.partner && req.partner.id === 'demo-partner-id') {
       return next();
     }
  }

  const token = await Token.findOne({ tokenId }).select('universityId').lean();
  if (!token || !token.universityId) return res.status(400).json({ success: false, message: 'Token no asociado a institución' });
  const uni = await User.findById(token.universityId).select('hederaAccountId isActive').lean();
  if (!uni) return res.status(404).json({ success: false, message: 'Institución no encontrada' });
  if (!uni.isActive) return res.status(403).json({ success: false, message: 'Institución pausada' });
  const accountId = String(uni.hederaAccountId || '').trim();
  if (!accountId) return res.status(400).json({ success: false, message: 'hederaAccountId no configurado para la institución' });
  const aclTokenId = String(process.env.ACL_TOKEN_ID || '0.0.7560139');
  
  // Bypass ACL check for main platform account (Treasury)
  if (accountId === process.env.HEDERA_ACCOUNT_ID) {
    req.universityId = String(token.universityId);
    return next();
  }

  try { await hederaService.connect(); } catch {}
  let associated = false;
  try {
    if (hederaService.isEnabled()) {
      associated = await hederaService.hasTokenAssociation(accountId, aclTokenId);
    }
  } catch {}
  if (!associated) {
    return res.status(403).json({ success: false, message: 'Acción bloqueada: El token ACL no está asociado a su cuenta' });
  }
  req.universityId = String(token.universityId);
  return next();
});
