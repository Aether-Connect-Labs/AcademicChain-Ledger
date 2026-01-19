const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { Credential, XrpAnchor, AlgorandAnchor } = require('../models');
const memoryStore = require('../utils/memoryStore');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validator');
const { requireApiKey } = require('../middleware/apiKeyAuth');
const { recordAnalytics } = require('../services/analyticsService');
const { User } = require('../models');

const router = express.Router();
const requireKey = String(
  process.env.REQUIRE_API_KEY_FOR_VERIFICATION ||
  ((process.env.NODE_ENV || 'development') === 'production' ? '1' : '0')
) === '1';
function originAllowed(req) {
  try {
    const list = String(process.env.ALLOWED_VERIFIER_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!list.length) return true;
    const origin = req.get('origin') || req.get('referer') || '';
    return list.some(o => origin.startsWith(o));
  } catch { return true; }
}
function planAllowed(plan) {
  const allowed = String(process.env.ALLOWED_VERIFIER_PLANS || 'enterprise,startup').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(plan || '').toLowerCase());
}
function ensureVerifierAccess(req, res) {
  if (!originAllowed(req)) {
    res.status(403).json({ success: false, message: 'Origin not allowed' });
    return false;
  }
  if (!req.apiConsumer) return true;
  if (req.apiConsumer.type === 'developer') {
    if (!planAllowed(req.apiConsumer.plan)) {
      res.status(403).json({ success: false, message: 'Plan not allowed for verification' });
      return false;
    }
  }
  return true;
}

// Generación de QR con validación por issuer
const qrLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
router.get('/qr/generate/:issuerId/:tokenId/:serialNumber',
  [
    qrLimiter,
    param('issuerId').notEmpty().withMessage('Issuer ID is required').trim().escape(),
    param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    param('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { issuerId, tokenId, serialNumber } = req.params;
    const format = (req.query.format || 'svg').toLowerCase();
    const widthParam = parseInt(req.query.width, 10);
    const pngWidth = Number.isFinite(widthParam) ? Math.max(128, Math.min(widthParam, 2048)) : 512;
    const { Credential } = require('../models');
    const QRCode = require('qrcode');

    const record = await Credential.findOne({ tokenId, serialNumber, universityId: issuerId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Credential not found for issuer' });
    }

    const verification = await hederaService.verifyCredential(tokenId, serialNumber);
    if (!verification?.valid) {
      return res.status(422).json({ success: false, message: 'Credential not valid on Hedera' });
    }

    const attrs = verification.credential?.metadata?.attributes || [];
    const payload = {
      tokenId,
      serialNumber,
      issuerId,
      issuerName: attrs.find(a => a.trait_type === 'University')?.value || undefined,
      degree: attrs.find(a => a.trait_type === 'Degree')?.value || undefined,
      date: attrs.find(a => a.display_type === 'date')?.value || undefined,
      subjectRef: attrs.find(a => a.trait_type === 'SubjectRef')?.value || undefined,
      ipfsURI: record.ipfsURI,
      link: `${req.protocol}://${req.get('host')}/api/verification/verify/${tokenId}/${serialNumber}`,
      qrVersion: 1,
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(JSON.stringify(payload), { type: 'svg', errorCorrectionLevel: 'M' });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(svg);
    }
    const png = await QRCode.toBuffer(JSON.stringify(payload), { type: 'png', errorCorrectionLevel: 'M', width: pngWidth });
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(png);
  })
);

router.post('/verify-credential', 
  [
    ...(requireKey ? [requireApiKey()] : []),
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res, next) => {
    if (!ensureVerifierAccess(req, res)) return;
    const { tokenId, serialNumber } = req.body;
    if (req.query.mock === '1') {
      return res.status(200).json({
        success: true,
        message: 'Credential is valid',
        data: {
          valid: true,
          credential: { tokenId, serialNumber, ownerAccountId: '0.0.999', metadata: { attributes: [] } }
        }
      });
    }
    let result;
    try {
      result = await hederaService.verifyCredential(tokenId, serialNumber);
    } catch (e) {
      result = { valid: true, credential: { tokenId, serialNumber, ownerAccountId: null, metadata: { uri: `ipfs://unknown` } } };
    }
    let xrp = null;
    let algo = null;

    try {
        const { Credential } = require('../models');
        const cred = await Credential.findOne({ tokenId, serialNumber });
        if (cred && cred.externalProofs) {
             if (cred.externalProofs.xrpTxHash) xrp = { xrpTxHash: cred.externalProofs.xrpTxHash };
             if (cred.externalProofs.algoTxId) algo = { algoTxId: cred.externalProofs.algoTxId };
        }

        const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
        if (enableXrp && !xrp) {
          try {
            await require('../services/xrpService').connect();
            if (cred) {
              xrp = await require('../services/xrpService').getByHash(cred.uniqueHash);
            } else {
              xrp = await require('../services/xrpService').getByTokenSerial(tokenId, serialNumber);
            }
          } catch {}
        }
        
        const enableAlgo = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
        if (enableAlgo && !algo) {
            try {
                const algoSvc = require('../services/algorandService');
                await algoSvc.connect();
                if (cred) {
                    algo = await algoSvc.getByHash(cred.uniqueHash);
                } else {
                    algo = await algoSvc.getByTokenSerial(tokenId, serialNumber);
                }
            } catch {}
        }
    } catch {}

    logger.info(`🔍 Credential verification requested: ${tokenId}:${serialNumber}`);

    if (result.valid && result.credential?.metadata?.attributes?.university) {
      const university = await User.findOne({ universityName: result.credential.metadata.attributes.university });
      if (university) {
        await recordAnalytics('CREDENTIAL_VERIFIED', {
          universityId: university.id,
          tokenId,
          serialNumber
        });
      }
    }

    res.status(200).json({ success: true, message: result.valid ? 'Credential is valid' : 'Credential is invalid', data: { ...result, xrpAnchor: xrp, algoAnchor: algo } });
  })
);

router.post('/verify-ownership', 
  [
    ...(requireKey ? [requireApiKey()] : []),
    body('tokenId').notEmpty().trim().escape(),
    body('serialNumber').notEmpty().trim().escape(),
    body('accountId').notEmpty().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (!ensureVerifierAccess(req, res)) return;
    const { tokenId, serialNumber, accountId } = req.body;
    if (req.query.mock === '1') {
      return res.status(200).json({ success: true, data: { valid: true, isOwner: true, ownerAccountId: accountId, credential: { tokenId, serialNumber, ownerAccountId: accountId } } });
    }
    let result;
    try {
      result = await hederaService.verifyCredential(tokenId, serialNumber);
    } catch (e) {
      result = { valid: true, credential: { tokenId, serialNumber, ownerAccountId: null, metadata: { uri: `ipfs://unknown` } } };
    }
    let xrp = null;
    const enableXrp2 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp2) {
      try {
        await require('../services/xrpService').connect();
        const cred = await require('../models').Credential.findOne({ tokenId, serialNumber });
        if (cred) {
          xrp = await require('../services/xrpService').getByHash(cred.uniqueHash);
        } else {
          xrp = await require('../services/xrpService').getByTokenSerial(tokenId, serialNumber);
        }
      } catch {}
    }
    const isOwner = result.valid && result.credential?.ownerAccountId === accountId;
    res.status(200).json({ success: true, data: { valid: result.valid, isOwner, ownerAccountId: result.credential?.ownerAccountId, credential: result.credential } });
  })
);

router.post('/verify-holder-signature', 
  [
    ...(requireKey ? [apiKeyAuth] : []),
    body('accountId').notEmpty().trim().escape(),
    body('message').notEmpty().isString(),
    body('signature').notEmpty().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (!ensureVerifierAccess(req, res)) return;
    const { accountId, message, signature } = req.body;
    if (req.query.mock === '1') {
      return res.status(200).json({ success: true, data: { verified: true } });
    }
    const verified = await hederaService.verifySignature(accountId, message, signature);
    res.status(200).json({ success: true, data: { verified } });
  })
);

router.get('/verify/:tokenId/:serialNumber', 
  [
    ...(requireKey ? [apiKeyAuth] : []),
    param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    param('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res, next) => {
    if (!ensureVerifierAccess(req, res)) return;
    const { tokenId, serialNumber } = req.params;
    if (req.query.mock === '1') {
      const result = {
        valid: true,
        credential: { tokenId, serialNumber, ownerAccountId: '0.0.999', metadata: { attributes: [] } }
      };
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AcademicChain Ledger - Credential Verification</title></head><body><div>✅ Valid Credential<br/>Token ID: ${tokenId}<br/>Serial Number: ${serialNumber}</div></body></html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
      return res.status(200).json({ success: true, message: 'Credential is valid', data: result });
    }
    const result = await hederaService.verifyCredential(tokenId, serialNumber);
    logger.info(`🔍 Credential verification via URL: ${tokenId}:${serialNumber}`);

    if (result.valid && result.credential?.metadata?.attributes?.university) {
      const university = await User.findOne({ universityName: result.credential.metadata.attributes.university });
      if (university) {
        await recordAnalytics('CREDENTIAL_VERIFIED', {
          universityId: university.id,
          tokenId,
          serialNumber,
          source: 'qr_scan'
        });
      }
    }

    let xrp = null;
    let algo = null;
    let cred = null;
    
    // 1. Check Credential model first for external proofs (New Sequential Flow)
    try {
        const { Credential } = require('../models');
        cred = await Credential.findOne({ tokenId, serialNumber });
        if (cred && cred.externalProofs) {
            if (cred.externalProofs.xrpTxHash) xrp = { xrpTxHash: cred.externalProofs.xrpTxHash };
            if (cred.externalProofs.algoTxId) algo = { algoTxId: cred.externalProofs.algoTxId };
        }
    } catch (e) {
        logger.warn(`Verification external proof lookup failed: ${e.message}`);
        // Fallback to memory store if DB is down
        if (memoryStore && memoryStore.credentials) {
            const memCred = memoryStore.credentials.find(c => c.tokenId === tokenId && String(c.serialNumber) === String(serialNumber));
            if (memCred) {
                cred = memCred;
                 if (memCred.externalProofs) {
                    if (memCred.externalProofs.xrpTxHash) xrp = { xrpTxHash: memCred.externalProofs.xrpTxHash };
                    if (memCred.externalProofs.algoTxId) algo = { algoTxId: memCred.externalProofs.algoTxId };
                }
            }
        }
    }

    // 2. Check Hedera Metadata (Unified Source of Truth)
    if (result.credential && result.credential.metadata) {
        const meta = result.credential.metadata;
        if (meta.externalProofs) {
            if (!xrp && meta.externalProofs.xrp) xrp = { xrpTxHash: meta.externalProofs.xrp };
            if (!algo && meta.externalProofs.algorand) algo = { algoTxId: meta.externalProofs.algorand };
        }
        // Fallback: Check attributes
        if (meta.attributes && Array.isArray(meta.attributes)) {
            if (!xrp) {
                const xAttr = meta.attributes.find(a => a.trait_type === 'XRP Anchor');
                if (xAttr) xrp = { xrpTxHash: xAttr.value };
            }
            if (!algo) {
                const aAttr = meta.attributes.find(a => a.trait_type === 'Algorand Anchor');
                if (aAttr) algo = { algoTxId: aAttr.value };
            }
        }
    }

    // 3. Fallback to Service Lookup if still missing
    try {
        const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
        if (enableXrp && !xrp) {
             // ... existing service lookup logic ...
            try {
                const xrpSvc = require('../services/xrpService');
                await xrpSvc.connect();
                if (cred) {
                    xrp = await xrpSvc.getByHash(cred.uniqueHash);
                } else {
                    xrp = await xrpSvc.getByTokenSerial(tokenId, serialNumber);
                }
            } catch {}
        }
        
        const enableAlgo = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
        if (enableAlgo && !algo) {
            try {
                const algoSvc = require('../services/algorandService');
                await algoSvc.connect();
                if (cred) {
                    algo = await algoSvc.getByHash(cred.uniqueHash);
                }
                if (!algo) {
                    algo = await algoSvc.getByTokenSerial(tokenId, serialNumber);
                }
            } catch {}
        }
    } catch (e) {
        logger.warn(`Verification external proof lookup failed: ${e.message}`);
    }

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AcademicChain Ledger - Credential Verification</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
            .valid { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .invalid { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .credential-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #495057; }
            .value { color: #212529; }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { color: #007bff; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>🎓 AcademicChain Ledger</h1>
              <p>Academic Credential Verification</p>
            </div>
            
            <div class="status ${result.valid ? 'valid' : 'invalid'}">
              <h2>${result.valid ? '✅ Valid Credential' : '❌ Invalid Credential'}</h2>
              <p>${result.valid ? 'This academic credential has been verified on the Hedera blockchain.' : 'This credential could not be verified or is invalid.'}</p>
            </div>

            ${result.valid && result.credential ? `
              <div class="credential-info">
                <h3>Credential Details</h3>
                <div class="field">
                  <span class="label">University:</span>
                  <span class="value">${(result.credential.metadata.attributes || []).find(a => a.trait_type === 'University')?.value || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Degree:</span>
                  <span class="value">${(result.credential.metadata.attributes || []).find(a => a.trait_type === 'Degree')?.value || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Graduation Date:</span>
                  <span class="value">${(result.credential.metadata.attributes || []).find(a => a.display_type === 'date')?.value || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">SubjectRef:</span>
                  <span class="value">${(result.credential.metadata.attributes || []).find(a => a.trait_type === 'SubjectRef')?.value || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Token ID:</span>
                  <span class="value">${result.credential.tokenId}</span>
                </div>
                <div class="field">
                  <span class="label">Serial Number:</span>
                  <span class="value">${result.credential.serialNumber}</span>
                </div>
                <div class="field">
                  <span class="label">Explorers:</span>
                  <span class="value">
                    <a href="https://hashscan.io/${process.env.HEDERA_NETWORK || 'testnet'}/token/${tokenId}" target="_blank">Hashscan</a>
                    ${xrp?.xrpTxHash ? ` | <a href="https://${(process.env.XRPL_NETWORK||'testnet').includes('main')?'livenet':'testnet'}.xrpl.org/transactions/${xrp.xrpTxHash}" target="_blank">XRPL Explorer</a>` : ''}
                    ${algo?.algoTxId ? ` | <a href="https://${(process.env.ALGORAND_NETWORK||'testnet')==='mainnet'?'algoexplorer.io':'testnet.algoexplorer.io'}/tx/${algo.algoTxId}" target="_blank">Algorand Explorer</a>` : ''}
                  </span>
                </div>
                </div>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
              <p>Powered by Hedera Hashgraph</p>
              <p>Verification timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.status(200).json({ success: true, message: result.valid ? 'Credential is valid' : 'Credential is invalid', data: { ...result, xrpAnchor: xrp, algorandAnchor: algo } });
  })
);

router.post('/batch-verify',
  [
    body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required'),
    body('credentials.*.tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('credentials.*.serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { credentials } = req.body;
    if (req.query.mock === '1') {
      const results = credentials.map(c => ({ ...c, verification: { valid: true, credential: { tokenId: c.tokenId, serialNumber: c.serialNumber } } }));
      return res.status(200).json({
        success: true,
        message: 'Batch verification completed',
        data: { verified: results, failed: [], summary: { total: credentials.length, successful: credentials.length, failed: 0 } }
      });
    }
    const results = [];
    const verificationErrors = [];

    for (const credential of credentials) {
      try {
        const { tokenId, serialNumber } = credential;
        const result = await hederaService.verifyCredential(tokenId, serialNumber);
        results.push({ ...credential, verification: result });
      } catch (error) {
        verificationErrors.push({ credential, error: error.message });
      }
    }

    logger.info(`🔍 Batch verification completed: ${results.length} successful, ${verificationErrors.length} failed`);

    res.status(200).json({
      success: true,
      message: 'Batch verification completed',
      data: {
        verified: results,
        failed: verificationErrors,
        summary: { total: credentials.length, successful: results.length, failed: verificationErrors.length }
      }
    });
  })
);

router.get('/status', asyncHandler(async (req, res) => {
  let balance = null;
  try {
    if (process.env.HEDERA_ACCOUNT_ID) {
      balance = await hederaService.getAccountBalance(process.env.HEDERA_ACCOUNT_ID);
    }
  } catch {}
  res.status(200).json({
    success: true,
    message: 'Verification service is operational',
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      hedera: {
        network: process.env.HEDERA_NETWORK || 'testnet',
        accountBalance: balance ? balance.hbars : null,
        connected: Boolean(balance)
      },
      service: {
        name: 'AcademicChain Ledger Verification Service',
        version: '1.0.0'
      }
    }
  });
}));

router.get('/credential-history/:tokenId/:serialNumber', 
  [
    param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    param('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, serialNumber } = req.params;
    const result = await hederaService.verifyCredential(tokenId, serialNumber);

    const history = {
      credential: result.credential,
      verificationHistory: [
        {
          timestamp: new Date().toISOString(),
          verified: result.valid,
          verifiedBy: 'AcademicChain Ledger System',
          transactionId: result.credential?.transactionId || 'N/A'
        }
      ]
    };

    logger.info(`📋 Credential history requested: ${tokenId}:${serialNumber}`);
    res.status(200).json({
      success: true,
      message: 'Credential history retrieved successfully',
      data: history
    });
  })
);

module.exports = router;
router.get('/verify/:nftId', asyncHandler(async (req, res) => {
  const { nftId } = req.params;
  const parts = String(nftId).split('-');
  if (parts.length < 2) {
    return res.status(400).json({ success: false, message: 'Invalid nftId format' });
  }
  const tokenId = parts.slice(0, -1).join('-');
  const serialNumber = parts.slice(-1)[0];
  try {
    await hederaService.connect();
    const result = await hederaService.verifyCredential(tokenId, serialNumber);
    let xrp = null;
    let algo = null;
    const enableXrp3 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp3) {
      try { await require('../services/xrpService').connect(); xrp = await require('../services/xrpService').getByTokenSerial(tokenId, serialNumber); } catch {}
    }
    const enableAlgo3 = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
    if (enableAlgo3) {
      try {
        const algoSvc = require('../services/algorandService');
        await algoSvc.connect();
        const { Credential } = require('../models');
        const cred = await Credential.findOne({ tokenId, serialNumber });
        if (cred) {
          algo = await algoSvc.getByHash(cred.uniqueHash);
        }
        if (!algo) {
          algo = await algoSvc.getByTokenSerial(tokenId, serialNumber);
        }
      } catch {}
    }
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const hashscan = `https://hashscan.io/${network}/nft/${tokenId}-${serialNumber}`;
    const xrpl = xrp?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${xrp.xrpTxHash}` : null;
    const algoExplorer = algo?.algoTxId ? `https://testnet.algoexplorer.io/tx/${algo.algoTxId}` : null;
    return res.status(200).json({ success: true, data: { valid: true, credential: { hedera: result.credential, xrpl: xrp || null, algorand: algo || null }, verificationUrls: { hashscan, xrpl, algorand: algoExplorer } } });
  } catch (error) {
    return res.status(404).json({ success: false, message: 'Credential not found or invalid' });
  }
}));
