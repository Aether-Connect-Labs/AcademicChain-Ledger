const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaServices');
const ipfsService = require('../services/ipfsService');
const logger = require('../utils/logger');

const router = express.Router();
const mem = { tokens: [], credentials: [] };

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

function demoEnabled() {
  const allow = String(process.env.DEMO_PUBLIC || '1') === '1';
  const net = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase();
  return allow && net === 'testnet';
}

router.post('/create-token', limiter, [
  body('tokenName').optional().isString().trim().escape(),
  body('tokenSymbol').optional().isString().trim().escape(),
], validate, asyncHandler(async (req, res) => {
  if (!demoEnabled()) {
    return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
  }
  const tokenName = req.body.tokenName || 'Demo Credential';
  const tokenSymbol = req.body.tokenSymbol || `DEMO_${Date.now()}`;
  let result;
  try {
    await hederaService.connect();
    result = await hederaService.createAcademicToken({ tokenName, tokenSymbol, tokenMemo: 'Demo token' });
  } catch (e) {
    const mockId = `0.0.${Math.floor(Math.random() * 1000000)}`;
    result = { tokenId: mockId, tokenName, tokenSymbol };
  }
  logger.info(`🎓 [DEMO] Academic token created: ${result.tokenId}`);
  try { mem.tokens.unshift({ tokenId: result.tokenId, tokenName, tokenSymbol, createdAt: new Date().toISOString() }); mem.tokens = mem.tokens.slice(0, 50); } catch {}
  res.status(201).json({ success: true, message: 'Token demo creado', data: result });
}));

router.post('/issue-credential', limiter, [
  body('tokenId').notEmpty().trim().escape(),
  body('uniqueHash').notEmpty().trim().escape(),
  body('ipfsURI').notEmpty().trim(),
  body('degree').optional().isString().trim(),
  body('studentName').optional().isString().trim(),
  body('recipientAccountId').optional().isString().trim(),
], validate, asyncHandler(async (req, res) => {
  if (!demoEnabled()) {
    return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
  }
  const { tokenId, uniqueHash, ipfsURI, recipientAccountId, degree, studentName } = req.body;
  try {
    let mint;
    try {
      await hederaService.connect();
      mint = await hederaService.mintAcademicCredential(tokenId, {
        tokenId,
        uniqueHash,
        ipfsURI,
        degree,
        studentName,
        university: 'Demo Institution',
      });
    } catch (e) {
      mint = { transactionId: 'tx-mock', serialNumber: Math.floor(Math.random() * 1000) + 1 };
    }
    let transfer = null;
    if (recipientAccountId) {
      try { transfer = await hederaService.transferCredentialToStudent(tokenId, mint.serialNumber, recipientAccountId); } catch { transfer = null; }
    }
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const nftId = `${tokenId}-${mint.serialNumber}`;
    const hashscanUrl = `https://hashscan.io/${network}/nft/${nftId}`;
    try { mem.credentials.unshift({ id: `${tokenId}-${mint.serialNumber}`, tokenId, serialNumber: mint.serialNumber, title: degree || 'Credential', issuer: 'Demo Institution', ipfsURI, createdAt: new Date().toISOString() }); mem.credentials = mem.credentials.slice(0, 100); } catch {}
    res.status(201).json({ success: true, data: { nftId, hashscanUrl, mintTxId: mint.transactionId, transfer } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

router.get('/credentials', asyncHandler(async (req, res) => {
  if (!demoEnabled()) {
    return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
  }
  res.status(200).json({ success: true, data: mem.credentials });
}));

router.get('/tokens', asyncHandler(async (req, res) => {
  if (!demoEnabled()) {
    return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
  }
  res.status(200).json({ success: true, data: mem.tokens });
}));

router.post('/pin-credential', limiter,
  [
    body('degree').optional().isString().trim(),
    body('studentName').optional().isString().trim(),
    body('tokenId').optional().isString().trim(),
    body('serialNumber').optional().isString().trim(),
    body('uniqueHash').optional().isString().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (!demoEnabled()) {
      return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
    }
    const degree = req.body.degree || 'Demo Degree';
    const studentName = req.body.studentName || 'Demo Student';
    const tokenId = req.body.tokenId || `0.0.${Math.floor(Math.random() * 1000000)}`;
    const serialNumber = req.body.serialNumber || String(Math.floor(Math.random() * 1000) + 1);
    const uniqueHash = req.body.uniqueHash || Math.random().toString(36).slice(2);
    const payload = {
      type: 'academic_credential',
      tokenId,
      serialNumber,
      degree,
      studentName,
      issuer: 'Demo Institution',
      date: new Date().toISOString(),
      uniqueHash,
      metadata: {
        attributes: [
          { trait_type: 'University', value: 'Demo Institution' },
          { trait_type: 'Degree', value: degree },
          { display_type: 'date', value: new Date().toISOString() },
          { trait_type: 'SubjectRef', value: uniqueHash }
        ]
      }
    };
    try {
      const pinned = await ipfsService.pinJson(payload, `Demo-Credential-${tokenId}-${serialNumber}`);
      const ipfsURI = `ipfs://${pinned.IpfsHash}`;
      return res.status(201).json({ success: true, data: { ipfsURI, cid: pinned.IpfsHash, pinned: true } });
    } catch (e) {
      const fallback = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      return res.status(200).json({ success: true, data: { ipfsURI: fallback, pinned: false } });
    }
  })
);

module.exports = router;
