const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const hederaService = require('../services/hederaServices');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validator');
const { recordAnalytics } = require('../services/analyticsService');
const { User } = require('../models');

const router = express.Router();

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
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res, next) => {
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
    const result = await hederaService.verifyCredential(tokenId, serialNumber);
    let xrp = null;
    const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp) {
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

    res.status(200).json({ success: true, message: result.valid ? 'Credential is valid' : 'Credential is invalid', data: { ...result, xrpAnchor: xrp } });
  })
);

router.post('/verify-ownership', 
  [
    body('tokenId').notEmpty().trim().escape(),
    body('serialNumber').notEmpty().trim().escape(),
    body('accountId').notEmpty().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, serialNumber, accountId } = req.body;
    if (req.query.mock === '1') {
      return res.status(200).json({ success: true, data: { valid: true, isOwner: true, ownerAccountId: accountId, credential: { tokenId, serialNumber, ownerAccountId: accountId } } });
    }
    const result = await hederaService.verifyCredential(tokenId, serialNumber);
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
    body('accountId').notEmpty().trim().escape(),
    body('message').notEmpty().isString(),
    body('signature').notEmpty().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
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
    param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    param('serialNumber').notEmpty().withMessage('Serial number is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res, next) => {
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
    const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp) {
      try {
        const xrpSvc = require('../services/xrpService');
        await xrpSvc.connect();
        const cred = await require('../models').Credential.findOne({ tokenId, serialNumber });
        if (cred) {
          xrp = await xrpSvc.getByHash(cred.uniqueHash);
        } else {
          xrp = await xrpSvc.getByTokenSerial(tokenId, serialNumber);
        }
      } catch {}
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
                    ${xrp?.xrpTxHash ? ` | <a href=\"https://testnet.xrplexplorer.com/tx/${xrp.xrpTxHash}\" target=\"_blank\">XRPL Explorer</a>` : ''}
                  </span>
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

    res.status(200).json({ success: true, message: result.valid ? 'Credential is valid' : 'Credential is invalid', data: { ...result, xrpAnchor: xrp } });
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
    const enableXrp3 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp3) {
      try { await require('../services/xrpService').connect(); xrp = await require('../services/xrpService').getByTokenSerial(tokenId, serialNumber); } catch {}
    }
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const hashscan = `https://hashscan.io/${network}/nft/${tokenId}-${serialNumber}`;
    const xrpl = xrp?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${xrp.xrpTxHash}` : null;
    return res.status(200).json({ success: true, data: { valid: true, credential: { hedera: result.credential, xrpl: xrp || null }, verificationUrls: { hashscan, xrpl } } });
  } catch (error) {
    return res.status(404).json({ success: false, message: 'Credential not found or invalid' });
  }
}));
