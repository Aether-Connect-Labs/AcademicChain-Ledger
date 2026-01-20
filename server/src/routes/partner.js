const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { partnerAuth, validateIssuance } = require('../middleware/partnerAuth');
const { validate } = require('../middleware/validator');
const associationGuard = require('../middleware/associationGuard');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const partnerService = require('../services/partnerService');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');
const rateOracle = require('../services/rateOracle');
const ROLES = require('../config/roles');
const { recordAnalytics } = require('../services/analyticsService');
const User = require('../models/User');
const Token = require('../models/Token');
const Credential = require('../models/Credential');
const Partner = require('../models/Partner');
// Try to import AnalyticsEvent safely
let AnalyticsEvent;
try {
  AnalyticsEvent = require('../models/AnalyticsEvent');
} catch (e) {
  // If it doesn't exist, we can live without it for now or mock it
  AnalyticsEvent = null;
}

// In-memory store for DEMO_MODE to make it interactive
const demoStore = {
  emissions: [
     {
          tokenId: '0.0.7685360',
          serialNumber: '1',
          institutionId: 'demo-university-id',
          institutionName: 'Demo University',
          status: 'ACTIVE',
          issuedAt: new Date().toISOString()
     },
     {
          tokenId: '0.0.7685354',
          serialNumber: '1',
          institutionId: 'demo-university-id',
          institutionName: 'Demo University',
          status: 'ACTIVE',
          issuedAt: new Date(Date.now() - 3600000).toISOString()
     }
  ]
};

/**
 * @route   POST /api/partner/verify
 * @desc    Allows a partner to verify a credential using its on-chain identifiers.
 * @access  Private (Partner only)
 */
router.post('/verify',
  partnerAuth,
  [
    body('tokenId').notEmpty().withMessage('Token ID is required'),
    body('serialNumber').notEmpty().withMessage('Serial number is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, serialNumber } = req.body;
    logger.info(`Verificación iniciada por partner: ${req.partner.name}`);

    const verificationResult = await hederaService.verifyCredential(tokenId, serialNumber);

    // Registrar esta verificación en el motor de analítica
    await recordAnalytics('PARTNER_VERIFICATION', { 
      partnerId: req.partner.id, 
      partnerName: req.partner.name,
      tokenId, 
      serialNumber });

    res.status(200).json({ success: true, data: verificationResult });
  }));

/**
 * @route   POST /api/partner/generate-key
 * @desc    Generates a new API key for a partner.
 * @access  Private (Admin only)
 */
router.post('/generate-key',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('partnerName').notEmpty().withMessage('Partner name is required'),
    body('universityId').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { partnerName, universityId } = req.body;

    const { partner, apiKey } = await partnerService.generateApiKey(partnerName);
    if (universityId) {
      partner.universityId = universityId;
      partner.permissions = Array.from(new Set([...(partner.permissions||[]), 'verify_credential', 'mint_credential']));
      await partner.save();
    }

    res.status(201).json({
      success: true,
      message: `API Key generated for ${partner.name}. Please copy it now, it will not be shown again.`,
      data: {
        partnerId: partner._id,
        apiKey: apiKey, // Only show the full key on creation
      }
    });
  }));

router.get('/dashboard/overview',
  partnerAuth,
  asyncHandler(async (req, res) => {
    if (req.isDemo || process.env.DEMO_MODE === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          totalEmissions: 1250,
          totalVerifications: 450,
          revokedCount: 12,
          activeInstitutions: 5,
          hbarBalance: 1500.50,
          usageSeries: [
             { date: new Date().toISOString().split('T')[0], count: 15 },
             { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 12 },
             { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], count: 20 },
          ],
          byInstitution: [
             { institutionId: 'demo-university-id', name: 'Demo University', emissions: 800, revoked: 5 },
             { institutionId: 'tech-institute-id', name: 'Tech Institute', emissions: 450, revoked: 7 }
          ],
        },
      });
    }

    const [totalEmissions, revokedCount, activeInstitutions] = await Promise.all([
      Credential.countDocuments({}).catch(() => 0),
      Credential.countDocuments({ status: 'REVOKED' }).catch(() => 0),
      User.countDocuments({ role: ROLES.UNIVERSITY, isActive: true }).catch(() => 0),
    ]);

    let totalVerifications = 0;
    try {
      if (AnalyticsEvent && typeof AnalyticsEvent.countDocuments === 'function') {
        totalVerifications = await AnalyticsEvent.countDocuments({
          type: { $in: ['CREDENTIAL_VERIFIED', 'PARTNER_VERIFICATION'] },
        });
      }
    } catch {}

    let hbarBalance = 0;
    try {
      await hederaService.connect();
      const accountId = process.env.HEDERA_ACCOUNT_ID || null;
      if (accountId && typeof hederaService.getAccountBalance === 'function') {
        const bal = await hederaService.getAccountBalance(accountId);
        hbarBalance = Number(bal || 0);
      }
    } catch {}

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let usageSeries = [];
    try {
      const usage = await Credential.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      usageSeries = usage.map((u) => ({ date: u._id, count: u.count }));
    } catch {}

    let byInstitution = [];
    try {
      const agg = await Credential.aggregate([
        { $match: { universityId: { $ne: null } } },
        {
          $group: {
            _id: '$universityId',
            emissions: { $sum: 1 },
            revoked: {
              $sum: {
                $cond: [{ $eq: ['$status', 'REVOKED'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { emissions: -1 } },
        { $limit: 20 },
      ]);
      const ids = agg.map((a) => a._id).filter(Boolean);
      const institutions = await User.find({ _id: { $in: ids } })
        .select('universityName name')
        .lean();
      const map = new Map(
        institutions.map((u) => [String(u._id), u.universityName || u.name || '']),
      );
      byInstitution = agg.map((a) => ({
        institutionId: a._id,
        name: map.get(String(a._id)) || null,
        emissions: a.emissions,
        revoked: a.revoked,
      }));
    } catch {}

    res.status(200).json({
      success: true,
      data: {
        totalEmissions,
        totalVerifications,
        revokedCount,
        activeInstitutions,
        hbarBalance,
        usageSeries,
        byInstitution,
      },
    });
  }));

router.get('/institutions',
  partnerAuth,
  asyncHandler(async (req, res) => {
    if (req.isDemo || process.env.DEMO_MODE === 'true') {
      const items = [
        {
          id: 'demo-university-id',
          name: 'Demo University',
          email: 'demo@university.edu',
          tokenId: '0.0.7685360',
          plan: 'enterprise',
          emissions: 800,
          revoked: 5,
          status: 'active',
          hederaAccountId: process.env.HEDERA_ACCOUNT_ID
        },
        {
          id: 'tech-institute-id',
          name: 'Tech Institute',
          email: 'admin@tech.edu',
          tokenId: '0.0.7685354',
          plan: 'basic',
          emissions: 450,
          revoked: 7,
          status: 'active',
          hederaAccountId: '0.0.12345'
        }
      ];
      return res.status(200).json({ success: true, data: { items } });
    }

    const institutions = await User.find({ role: ROLES.UNIVERSITY })
      .select('name email universityName hederaAccountId isActive plan')
      .lean();

    const ids = institutions.map((u) => String(u._id));

    const [tokens, emissionsAgg] = await Promise.all([
      Token.find({ universityId: { $in: ids } }).select('tokenId universityId').lean(),
      Credential.aggregate([
        { $match: { universityId: { $in: ids } } },
        {
          $group: {
            _id: '$universityId',
            emissions: { $sum: 1 },
            revoked: {
              $sum: {
                $cond: [{ $eq: ['$status', 'REVOKED'] }, 1, 0],
              },
            },
          },
        },
      ]).catch(() => []),
    ]);

    const tokenByUniversity = new Map();
    for (const t of tokens) {
      const uid = String(t.universityId);
      if (!tokenByUniversity.has(uid)) {
        tokenByUniversity.set(uid, t.tokenId);
      }
    }

    const emissionsByUniversity = new Map();
    for (const e of emissionsAgg) {
      emissionsByUniversity.set(String(e._id), {
        emissions: e.emissions,
        revoked: e.revoked,
      });
    }

    const items = institutions.map((u) => {
      const key = String(u._id);
      const stats = emissionsByUniversity.get(key) || { emissions: 0, revoked: 0 };
      return {
        id: key,
        name: u.universityName || u.name,
        email: u.email,
        tokenId: tokenByUniversity.get(key) || null,
        plan: u.plan || 'basic',
        emissions: stats.emissions,
        revoked: stats.revoked,
        status: u.isActive ? 'active' : 'inactive',
        hederaAccountId: u.hederaAccountId || null,
      };
    });

    res.status(200).json({ success: true, data: { items } });
  }));

router.get('/api-keys',
  partnerAuth,
  asyncHandler(async (req, res) => {
    const partners = await Partner.find({ isActive: true })
      .select('name contactEmail keyPrefix plan universityId createdAt updatedAt')
      .lean();

    const items = partners.map((p) => ({
      id: String(p._id),
      label: p.name,
      prefix: p.keyPrefix,
      lastDigits: '****',
      role: p.universityId ? 'institution' : 'partner',
      plan: p.plan || 'enterprise',
      contactEmail: p.contactEmail || null,
      universityId: p.universityId || null,
      rateLimit: null,
      lastUsedAt: null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.status(200).json({ success: true, data: { items } });
  }));

router.get('/emissions',
  partnerAuth,
  asyncHandler(async (req, res) => {
    const institutionId = String(req.query.institutionId || '').trim();
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '100', 10) || 100));
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10) || 0);

    if (req.isDemo || process.env.DEMO_MODE === 'true') {
      const mockItems = demoStore.emissions;
      // Simple filter support
      const filtered = mockItems.filter(item => {
          if (institutionId && item.institutionId !== institutionId) return false;
          if (statusFilter === 'revocada' && item.status !== 'REVOKED') return false;
          if (statusFilter === 'emitida' && item.status === 'REVOKED') return false;
          return true;
      });

      return res.status(200).json({
        success: true,
        data: {
          items: filtered,
          paging: { limit, offset, total: filtered.length },
        },
      });
    }

    const q = {};
    if (institutionId) q.universityId = institutionId;
    if (statusFilter === 'revocada') q.status = 'REVOKED';
    if (statusFilter === 'emitida') q.status = { $ne: 'REVOKED' };

    const [list, count] = await Promise.all([
      Credential.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Credential.countDocuments(q),
    ]);

    const universityIds = Array.from(
      new Set(list.map((c) => c.universityId).filter(Boolean)),
    );
    const universities = await User.find({ _id: { $in: universityIds } })
      .select('universityName name')
      .lean();
    const uniMap = new Map(
      universities.map((u) => [String(u._id), u.universityName || u.name || '']),
    );

    const items = list.map((c) => ({
      tokenId: c.tokenId,
      serialNumber: c.serialNumber,
      institutionId: c.universityId || null,
      institutionName: c.universityId ? uniMap.get(String(c.universityId)) || null : null,
      status: c.status || 'ACTIVE',
      issuedAt: c.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        items,
        paging: { limit, offset, total: count },
      },
    });
  }));

/**
 * @route   POST /api/partner/institution/mint
 * @desc    Allows an institution (via API key) to mint a credential NFT.
 * @access  Private (Institution via API key)
 */
router.post('/institution/mint',
  partnerAuth,
  validateIssuance,
  associationGuard,
  [
    body('tokenId').notEmpty().withMessage('Token ID is required'),
    body('uniqueHash').notEmpty().withMessage('uniqueHash is required'),
    body('ipfsURI').notEmpty().withMessage('ipfsURI is required'),
    body('recipientAccountId').optional().isString(),
    body('degree').optional().isString(),
    body('studentName').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const partner = req.partner;
    if (req.query.mock === '1' && process.env.NODE_ENV !== 'production') {
      const serialNumber = 1;
      
      // Update Demo Store
      demoStore.emissions.unshift({
        tokenId: req.body.tokenId,
        serialNumber: String(serialNumber),
        institutionId: partner.universityId || 'demo-university-id',
        institutionName: partner.name || 'Demo University',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      });

      await recordAnalytics('CREDENTIAL_MINTED_PARTNER', {
        partnerId: partner.id,
        partnerName: partner.name,
        tokenId: req.body.tokenId,
        serialNumber,
        degree: req.body.degree,
      });
      const { Credential } = require('../models');
      await Credential.create({
        tokenId: req.body.tokenId,
        serialNumber,
        universityId: partner.universityId,
        studentAccountId: req.body.recipientAccountId || null,
        uniqueHash: req.body.uniqueHash,
        ipfsURI: req.body.ipfsURI,
      });
      let xrp = null;
      const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
      if (enableXrp) {
        try {
          await xrpService.connect();
          const anchorDoc = await xrpService.anchor({
            certificateHash: req.body.uniqueHash,
            hederaTokenId: req.body.tokenId,
            serialNumber,
            timestamp: new Date().toISOString(),
          });
          xrp = anchorDoc;
        } catch {}
      }
      return res.status(201).json({ success: true, message: 'Credential minted successfully (mock)', data: { mint: { serialNumber, transactionId: 'tx-mock' }, transfer: null, xrpTxHash: xrp?.xrpTxHash || null } });
    }
    if (!partner.permissions || !partner.permissions.includes('mint_credential')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Partner lacks mint_credential permission.' });
    }
    if (!partner.universityId) {
      return res.status(400).json({ success: false, message: 'Partner is not linked to a universityId.' });
    }
    const { tokenId, uniqueHash, ipfsURI, recipientAccountId, degree, studentName } = req.body;
    
    if ((req.isDemo || process.env.DEMO_MODE === 'true') && partner.id === 'demo-partner-id') {
       logger.info('DEMO_MODE: Bypassing Token check for mint');
    } else {
       const { Token } = require('../models');
       const token = await Token.findOne({ tokenId, universityId: partner.universityId });
       if (!token) {
         return res.status(403).json({ success: false, message: 'Forbidden: Token does not belong to your institution.' });
       }
    }

    const mintResult = await hederaService.mintAcademicCredential(tokenId, {
      uniqueHash,
      ipfsURI,
      degree,
      studentName,
      university: partner.name,
      recipientAccountId,
    });
    
    // Update Demo Store if applicable
    if (req.isDemo || process.env.DEMO_MODE === 'true') {
        demoStore.emissions.unshift({
            tokenId,
            serialNumber: String(mintResult.serialNumber),
            institutionId: partner.universityId || 'demo-university-id',
            institutionName: partner.name || 'Demo University',
            status: 'ACTIVE',
            issuedAt: new Date().toISOString()
        });
    }

    let transferResult = null;
    if (recipientAccountId) {
      transferResult = await hederaService.transferCredentialToStudent(tokenId, mintResult.serialNumber, recipientAccountId);
    }
    await recordAnalytics('CREDENTIAL_MINTED_PARTNER', {
      partnerId: partner.id,
      partnerName: partner.name,
      tokenId,
      serialNumber: mintResult.serialNumber,
      degree,
    });
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, message: 'Credential minted successfully (test)', data: { mint: mintResult, transfer: transferResult } });
    }
    
    if (!req.isDemo && process.env.DEMO_MODE !== 'true') {
      const { Credential } = require('../models');
      await Credential.create({
        tokenId,
        serialNumber: mintResult.serialNumber,
        universityId: partner.universityId,
        studentAccountId: recipientAccountId || null,
        uniqueHash,
        ipfsURI,
      });
    }
    let xrp = null;
    const enableXrp2 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
    if (enableXrp2) {
      try {
        await xrpService.connect();
        const anchorDoc = await xrpService.anchor({
          certificateHash: uniqueHash,
          hederaTokenId: tokenId,
          serialNumber: mintResult.serialNumber,
          timestamp: new Date().toISOString(),
        });
        xrp = anchorDoc;
      } catch {}
    }
    let algorand = null;
    const enableAlgorand2 = String(process.env.ENABLE_ALGORAND || '0') === '1' || String(process.env.ALGORAND_ENABLED || 'false') === 'true';
    if (enableAlgorand2) {
      try {
        await algorandService.connect();
        const anchorDoc = await algorandService.anchor({
          certificateHash: uniqueHash,
          hederaTokenId: tokenId,
          serialNumber: mintResult.serialNumber,
          timestamp: new Date().toISOString(),
        });
        algorand = anchorDoc;
      } catch {}
    }
    res.status(201).json({ success: true, message: 'Credential minted successfully', data: { mint: mintResult, transfer: transferResult, xrpTxHash: xrp?.xrpTxHash || null, algoTxId: algorand?.algoTxId || null } });
  })
);

/**
 * @route   POST /api/partner/institution/create-token
 * @desc    Create an academic token for the linked university (via API key).
 * @access  Private (Institution via API key)
 */
  router.post('/institution/create-token',
    partnerAuth,
    [
      body('tokenName').notEmpty().withMessage('Token name is required'),
      body('tokenSymbol').notEmpty().withMessage('Token symbol is required'),
      body('tokenMemo').optional().isString(),
    ],
    validate,
    asyncHandler(async (req, res) => {
      const partner = req.partner;
      const { tokenName, tokenSymbol, tokenMemo } = req.body;
      
      let universityUser;

      if ((req.isDemo || process.env.DEMO_MODE === 'true') && partner.id === 'demo-partner-id') {
        logger.info('DEMO_MODE: Using env Hedera account for create-token');
        universityUser = {
          universityName: 'Demo University',
          hederaAccountId: process.env.HEDERA_ACCOUNT_ID
        };
      } else {
        if (!partner.universityId) {
          return res.status(400).json({ success: false, message: 'Partner is not linked to a universityId.' });
        }
        universityUser = await User.findById(partner.universityId);
      }

      if (!universityUser || !universityUser.hederaAccountId) {
        return res.status(400).json({ success: false, message: 'Linked university lacks Hedera account configuration.' });
      }
      if (req.query.mock === '1' && process.env.NODE_ENV !== 'production') {
        const tokenId = '0.0.mocktoken';
        // Mock DB create
        if (!req.isDemo && process.env.DEMO_MODE !== 'true') {
           await Token.create({ tokenId, tokenName, tokenSymbol, universityId: partner.universityId });
        }
        return res.status(201).json({ success: true, message: 'Academic token created successfully (mock)', data: { tokenId, transactionId: 'tx-mock' } });
      }
      const result = await hederaService.createAcademicToken({
        tokenName: `${universityUser.universityName} - ${tokenName}`,
        tokenSymbol,
        tokenMemo: tokenMemo || `Academic credential from ${universityUser.universityName}`,
        treasuryAccountId: universityUser.hederaAccountId,
      });
      
      if (!req.isDemo && process.env.DEMO_MODE !== 'true') {
        await Token.create({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: partner.universityId });
      }
      
      res.status(201).json({ success: true, message: 'Academic token created successfully', data: result });
    })
  );

  router.get('/institution/tokens',
    partnerAuth,
    asyncHandler(async (req, res) => {
      const partner = req.partner;
      if (!partner.universityId) {
        return res.status(400).json({ success: false, message: 'Partner is not linked to a universityId.' });
      }
      const list = await Token.find({ universityId: partner.universityId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: list });
    })
  );

// Puente básico XRP ↔ HBAR
router.post('/bridge/quote', partnerAuth,
  [
    body('direction').notEmpty().withMessage('direction is required').trim().isIn(['XRP_TO_HBAR','HBAR_TO_XRP']),
    body('amount').notEmpty().withMessage('amount is required').isFloat({ gt: 0 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { direction, amount } = req.body;
    const rateResp = await rateOracle.getRate();
    const rate = Number(rateResp?.data?.rate || parseFloat(process.env.XRPHBAR_RATE || global.XRPHBAR_RATE_CACHE || '1'));
    const quote = direction === 'XRP_TO_HBAR' ? amount * rate : amount / rate;
    res.status(200).json({ success: true, data: { rate, direction, amount, quote } });
  })
);

router.post('/bridge/convert', partnerAuth,
  [
    body('direction').notEmpty().trim().isIn(['XRP_TO_HBAR','HBAR_TO_XRP']),
    body('amount').notEmpty().isFloat({ gt: 0 }),
    body('hederaRecipient').optional().isString(),
    body('xrpTxHash').optional().isString(),
    body('xrpRecipient').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { direction, amount, hederaRecipient, xrpTxHash, xrpRecipient } = req.body;
    const rateResp = await rateOracle.getRate();
    const rate = Number(rateResp?.data?.rate || parseFloat(process.env.XRPHBAR_RATE || global.XRPHBAR_RATE_CACHE || '1'));
    if (direction === 'XRP_TO_HBAR') {
      if (!hederaRecipient || !xrpTxHash) {
        return res.status(400).json({ success: false, message: 'hederaRecipient and xrpTxHash are required for XRP_TO_HBAR' });
      }
      if (!/^[A-Fa-f0-9]{64}$/.test(xrpTxHash)) {
        return res.status(400).json({ success: false, message: 'Invalid XRPL transaction hash format' });
      }
      await xrpService.connect();
      const dest = xrpService.getAddress();
      const minDrops = Math.max(1, Math.round(Number(amount) * 1_000_000));
      const verify = await xrpService.verifyPayment({ txHash: xrpTxHash, destination: dest, minDrops, memoContains: 'BRIDGE' });
      if (!verify.verified) {
        return res.status(402).json({ success: false, message: 'XRP payment verification failed' });
      }
      const tinybars = Math.round(amount * rate * 1e8);
      const tx = await hederaService.sendHbar(hederaRecipient, tinybars);
      await cacheService.increment('metrics:xrphbar_conversions_total:XRP_TO_HBAR', 1);
      return res.status(201).json({ success: true, message: 'Conversion completed', data: { hbarTxId: tx.transactionId, xrpVerified: true } });
    } else {
      await hederaService.connect();
      await xrpService.connect();
      const drops = Math.round(amount / rate * 1_000_000);
      const dest = xrpRecipient || xrpService.getAddress();
      const memo = `BRIDGE:${req.partner.id}:${amount}`;
      const r = await xrpService.sendPayment({ destination: dest, amountDrops: drops, memo });
      await cacheService.increment('metrics:xrphbar_conversions_total:HBAR_TO_XRP', 1);
      return res.status(201).json({ success: true, message: 'Conversion simulated (HBAR→XRP)', data: { xrpTxHash: r.hash } });
    }
  })
);

/**
 * @route   POST /api/partner/institution/revoke
 * @desc    Allows an institution (via API key) to revoke a credential.
 * @access  Private (Institution via API key)
 */
router.post('/institution/revoke',
  partnerAuth,
  validateIssuance,
  associationGuard,
  [
    body('tokenId').notEmpty().withMessage('Token ID is required'),
    body('serialNumber').notEmpty().withMessage('Serial number is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const partner = req.partner;
    const { tokenId, serialNumber, reason } = req.body;

    if (req.isDemo || process.env.DEMO_MODE === 'true') {
        logger.info(`DEMO_MODE: Revoking credential ${tokenId}#${serialNumber} for ${partner.name}`);
        
        // Update in memory store
        const item = demoStore.emissions.find(i => i.tokenId === tokenId && i.serialNumber === String(serialNumber));
        if (item) {
            item.status = 'REVOKED';
        }
        
        return res.status(200).json({
            success: true,
            message: 'Credential revoked successfully (DEMO)',
            data: {
                transactionId: '0.0.12345@1234567890.000000000',
                status: 'REVOKED'
            }
        });
    }

    const burnResult = await hederaService.burnCredential(tokenId, serialNumber);

    // Update DB
    const { Credential } = require('../models');
    await Credential.updateOne(
        { tokenId, serialNumber }, 
        { $set: { status: 'REVOKED', revocationReason: reason, revokedAt: new Date() } }
    );

    await recordAnalytics('CREDENTIAL_REVOKED_PARTNER', {
      partnerId: partner.id,
      partnerName: partner.name,
      tokenId,
      serialNumber,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Credential revoked successfully',
      data: burnResult,
    });
  }));
 
 module.exports = router;
