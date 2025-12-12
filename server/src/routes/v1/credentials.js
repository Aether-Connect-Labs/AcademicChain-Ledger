const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const hederaService = require('../../services/hederaServices');
const xrpService = require('../../services/xrpService');
const algorandService = require('../../services/algorandService');
const { decideChainFromRequest } = require('../../services/routingService');
const { Token, Credential } = require('../../models');
const { isConnected: isMongoConnected } = require('../../config/database');
const useMem = () => {
  const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  // In tests, prefer mocked models. In dev without DB, use in-memory.
  if (isTest) return false;
  return (process.env.DISABLE_MONGO === '1' || !isMongoConnected());
};
const mem = { tokens: [], credentials: [] };
const { validate } = require('../../middleware/validator');
const apiKeyAuth = require('../../middleware/apiKeyAuth');
const apiRateLimit = require('../../middleware/apiRateLimit');

router.post('/issue', apiKeyAuth, apiRateLimit, [
  body('tokenId').notEmpty().trim(),
  body('uniqueHash').notEmpty().trim(),
  body('ipfsURI').notEmpty().trim(),
  body('studentName').notEmpty().trim(),
  body('degree').notEmpty().trim(),
  body('recipientAccountId').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, uniqueHash, ipfsURI, studentName, degree, recipientAccountId } = req.body;
  let token = useMem() ? mem.tokens.find(t => t.tokenId === tokenId) : await Token.findOne({ tokenId });
  if (!token && String(process.env.ALLOW_V1_TOKEN_AUTO_CREATE).toLowerCase() === 'true') {
    const name = `AcademicChain - ${degree || 'Credential'}`;
    const created = await hederaService.createAcademicToken({ tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}`, tokenMemo: `Auto-created for v1 issuance`, treasuryAccountId: process.env.HEDERA_ACCOUNT_ID || null });
    if (useMem()) {
      token = { tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` };
      mem.tokens.push(token);
    } else {
      token = await Token.create({ tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` });
    }
  }
  const universityLabel = token?.tokenName || 'AcademicChain';
  const mintResult = await hederaService.mintAcademicCredential(tokenId, {
    uniqueHash,
    ipfsURI,
    degree,
    studentName,
    university: universityLabel,
    recipientAccountId,
  });
  let transferResult = null;
  if (recipientAccountId) {
    transferResult = await hederaService.transferCredentialToStudent(tokenId, mintResult.serialNumber, recipientAccountId);
  }
  if (useMem()) {
    mem.credentials.push({ tokenId, serialNumber: mintResult.serialNumber, universityId: token?.universityId || null, studentAccountId: recipientAccountId || null, uniqueHash, ipfsURI, createdAt: new Date() });
  } else {
    await Credential.create({ tokenId, serialNumber: mintResult.serialNumber, universityId: token?.universityId || null, studentAccountId: recipientAccountId || null, uniqueHash, ipfsURI });
  }
  let xrplAnchor = null;
  let algoAnchor = null;
  try {
    await xrpService.connect();
    xrplAnchor = await xrpService.anchor({
      certificateHash: uniqueHash,
      hederaTokenId: tokenId,
      serialNumber: mintResult.serialNumber,
      timestamp: new Date().toISOString(),
    });
  } catch {}
  try {
    await algorandService.connect();
    algoAnchor = await algorandService.anchor({
      certificateHash: uniqueHash,
      hederaTokenId: tokenId,
      serialNumber: mintResult.serialNumber,
      timestamp: new Date().toISOString(),
    });
  } catch {}
  res.status(201).json({ success: true, message: 'Credential issued', data: { mint: mintResult, transfer: transferResult, xrplAnchor: xrplAnchor ? { txHash: xrplAnchor.xrpTxHash || null, ledgerIndex: xrplAnchor.ledgerIndex || null, status: xrplAnchor.status || 'completed', network: xrplAnchor.network || xrpService.network } : undefined, algorandAnchor: algoAnchor ? { txId: algoAnchor.algoTxId || null, status: algoAnchor.status || 'completed', network: algoAnchor.network || algorandService.network } : undefined } });
}));

router.post('/issue-unified', apiKeyAuth, apiRateLimit, [
  body('tokenId').notEmpty().trim(),
  body('uniqueHash').notEmpty().trim(),
  body('ipfsURI').notEmpty().trim(),
  body('studentName').notEmpty().trim(),
  body('degree').notEmpty().trim(),
  body('recipientAccountId').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, uniqueHash, ipfsURI, studentName, degree, recipientAccountId } = req.body;
  let token = useMem() ? mem.tokens.find(t => t.tokenId === tokenId) : await Token.findOne({ tokenId });
  if (!token && String(process.env.ALLOW_V1_TOKEN_AUTO_CREATE).toLowerCase() === 'true') {
    const name = `AcademicChain - ${degree || 'Credential'}`;
    const created = await hederaService.createAcademicToken({ tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}`, tokenMemo: `Auto-created for unified issuance`, treasuryAccountId: process.env.HEDERA_ACCOUNT_ID || null });
    if (useMem()) { token = { tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` }; mem.tokens.push(token); }
    else { token = await Token.create({ tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` }); }
  }
  const universityLabel = token?.tokenName || 'AcademicChain';
  const mintResult = await hederaService.mintAcademicCredential(tokenId, { uniqueHash, ipfsURI, degree, studentName, university: universityLabel, recipientAccountId });
  let transferResult = null;
  if (recipientAccountId) {
    transferResult = await hederaService.transferCredentialToStudent(tokenId, mintResult.serialNumber, recipientAccountId);
  }
  if (useMem()) { mem.credentials.push({ tokenId, serialNumber: mintResult.serialNumber, universityId: token?.universityId || null, studentAccountId: recipientAccountId || null, uniqueHash, ipfsURI, createdAt: new Date() }); }
  else { await Credential.create({ tokenId, serialNumber: mintResult.serialNumber, universityId: token?.universityId || null, studentAccountId: recipientAccountId || null, uniqueHash, ipfsURI }); }

  const primary = decideChainFromRequest(req);
  const order = primary === 'xrpl' ? ['xrpl','algorand'] : (primary === 'algorand' ? ['algorand','xrpl'] : ['xrpl','algorand']);
  let primaryAnchor = null; let secondaryAnchor = null;
  for (const chain of order) {
    try {
      if (chain === 'xrpl') { await xrpService.connect(); primaryAnchor = await xrpService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
      if (chain === 'algorand') { await algorandService.connect(); primaryAnchor = await algorandService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
      break;
    } catch {}
  }
  try {
    if (!primaryAnchor || order[0] !== 'xrpl') { await xrpService.connect(); secondaryAnchor = await xrpService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
  } catch {}
  try {
    if (!primaryAnchor || order[0] !== 'algorand') { await algorandService.connect(); secondaryAnchor = await algorandService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
  } catch {}

  res.status(201).json({ success: true, message: 'Credential issued (unified)', data: {
    mint: mintResult,
    transfer: transferResult,
    anchors: {
      primary: primaryAnchor ? { chain: order[0], id: primaryAnchor.xrpTxHash || primaryAnchor.algoTxId || null, status: primaryAnchor.status || 'completed' } : null,
      secondary: secondaryAnchor ? { id: secondaryAnchor.xrpTxHash || secondaryAnchor.algoTxId || null, status: secondaryAnchor.status || 'completed' } : null,
    }
  } });
}));

module.exports = router;
/**
 * @swagger
 * /api/v1/credentials/issue:
 *   post:
 *     summary: Emite una credencial con API Key
 *     tags: [Credentials]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *               uniqueHash:
 *                 type: string
 *               ipfsURI:
 *                 type: string
 *               studentName:
 *                 type: string
 *               degree:
 *                 type: string
 *               recipientAccountId:
 *                 type: string
*     responses:
*       201:
*         description: Credencial emitida
*         content:
*           application/json:
*             examples:
*               created:
*                 value:
*                   success: true
*                   message: "Credential issued"
*                   data:
*                     mint:
*                       serialNumber: "1"
*                       transactionId: "0.0.abc-def"
*                     transfer:
*                       transactionId: "0.0.xyz"
 */
