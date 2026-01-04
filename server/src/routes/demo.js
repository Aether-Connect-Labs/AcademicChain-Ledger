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
  const allow = String(process.env.DEMO_PUBLIC || '0') === '1';
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
  body('tokenId').optional().trim().escape(),
  body('uniqueHash').optional().trim().escape(),
  body('ipfsURI').optional().trim(),
  body('degree').optional().isString().trim(),
  body('studentName').optional().isString().trim(),
  body('image').optional().isString().trim(),
  body('recipientAccountId').optional().isString().trim(),
], validate, asyncHandler(async (req, res) => {
  if (!demoEnabled()) {
    return res.status(403).json({ success: false, message: 'Demo público deshabilitado o no está en testnet.' });
  }
  let { tokenId, uniqueHash, ipfsURI, recipientAccountId, degree, studentName, image } = req.body;
  try {
    if (!tokenId) {
      try {
        await hederaService.connect();
        const created = await hederaService.createAcademicToken({ tokenName: 'Demo Credential', tokenSymbol: `DEMO_${Date.now()}`, tokenMemo: 'Auto-created for demo' });
        tokenId = created.tokenId;
      } catch {
        tokenId = `0.0.${Math.floor(Math.random() * 1000000)}`;
      }
    }
    if (!uniqueHash) {
      uniqueHash = Math.random().toString(36).slice(2);
    }
    if (!ipfsURI) {
      const payload = {
        type: 'academic_credential',
        tokenId,
        serialNumber: String(Math.floor(Math.random() * 1000) + 1),
        degree: degree || 'Demo Degree',
        studentName: studentName || 'Demo Student',
        issuer: 'Demo Institution',
        date: new Date().toISOString(),
        uniqueHash,
        metadata: {
          attributes: [
            { trait_type: 'University', value: 'Demo Institution' },
            { trait_type: 'Degree', value: degree || 'Demo Degree' },
            { display_type: 'date', value: new Date().toISOString() },
            { trait_type: 'SubjectRef', value: uniqueHash }
          ]
        }
      };
      try {
        const pinned = await ipfsService.pinJson(payload, `Demo-Credential-${tokenId}`);
        ipfsURI = `ipfs://${pinned.IpfsHash}`;
      } catch {
        ipfsURI = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }
    }
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
        image,
      });
    } catch (e) {
      mint = { transactionId: 'tx-mock', serialNumber: Math.floor(Math.random() * 1000) + 1 };
    }
    let transfer = null;
    if (recipientAccountId) {
      try { transfer = await hederaService.transferCredentialToStudent(tokenId, mint.serialNumber, recipientAccountId); } catch { transfer = null; }
    }
    let xrplAnchor = null;
    let algorandAnchor = null;
    try {
      const xrpService = require('../services/xrpService');
      await xrpService.connect();
      xrplAnchor = await xrpService.anchor({
        certificateHash: uniqueHash,
        hederaTokenId: tokenId,
        serialNumber: mint.serialNumber,
        timestamp: new Date().toISOString(),
      });
    } catch {}
    try {
      const algorandService = require('../services/algorandService');
      await algorandService.connect();
      algorandAnchor = await algorandService.anchor({
        certificateHash: uniqueHash,
        hederaTokenId: tokenId,
        serialNumber: mint.serialNumber,
        timestamp: new Date().toISOString(),
      });
    } catch {}
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const nftId = `${tokenId}-${mint.serialNumber}`;
    const hashscanUrl = `https://hashscan.io/${network}/nft/${nftId}`;
    try { mem.credentials.unshift({ id: `${tokenId}-${mint.serialNumber}`, tokenId, serialNumber: mint.serialNumber, title: degree || 'Credential', issuer: 'Demo Institution', ipfsURI, createdAt: new Date().toISOString() }); mem.credentials = mem.credentials.slice(0, 100); } catch {}
    const xrplUrl = xrplAnchor?.xrpTxHash ? `https://${(process.env.XRPL_NETWORK||'testnet').includes('main')?'livenet':'testnet'}.xrpl.org/transactions/${xrplAnchor.xrpTxHash}` : null;
    const algoUrl = algorandAnchor?.algoTxId ? `https://${(process.env.ALGORAND_NETWORK||'testnet')==='mainnet'?'explorer.perawallet.app':'testnet.explorer.perawallet.app'}/tx/${algorandAnchor.algoTxId}/` : null;
    res.status(201).json({ success: true, data: { nftId, hashscanUrl, mintTxId: mint.transactionId, transfer, anchors: { xrpl: xrplAnchor ? { hash: xrplAnchor.xrpTxHash || null, url: xrplUrl } : null, algorand: algorandAnchor ? { txId: algorandAnchor.algoTxId || null, url: algoUrl } : null } } });
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
    body('image').optional().isString().trim(),
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
    const rawImage = req.body.image || '';
    const normalizedImage = rawImage ? (rawImage.startsWith('ipfs://') ? rawImage : `ipfs://${String(rawImage).replace('ipfs://','')}`) : undefined;
    const payload = {
      type: 'academic_credential',
      tokenId,
      serialNumber,
      degree,
      studentName,
      issuer: 'Demo Institution',
      date: new Date().toISOString(),
      uniqueHash,
      image: normalizedImage || undefined,
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
      return res.status(201).json({ success: true, data: { ipfsURI, cid: pinned.IpfsHash, pinned: true, image: normalizedImage || null } });
    } catch (e) {
      const fallback = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      return res.status(200).json({ success: true, data: { ipfsURI: fallback, pinned: false, image: normalizedImage || null } });
    }
  })
);

module.exports = router;
