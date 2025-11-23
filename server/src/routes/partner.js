const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const partnerAuth = require('../middleware/partnerAuth');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaServices');
const partnerService = require('../services/partnerService');
const logger = require('../utils/logger');
const ROLES = require('../config/roles');
const { recordAnalytics } = require('../services/analyticsService');
const { User, Token } = require('../models');

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

/**
 * @route   POST /api/partner/institution/mint
 * @desc    Allows an institution (via API key) to mint a credential NFT.
 * @access  Private (Institution via API key)
 */
router.post('/institution/mint',
  partnerAuth,
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
      return res.status(201).json({ success: true, message: 'Credential minted successfully (mock)', data: { mint: { serialNumber, transactionId: 'tx-mock' }, transfer: null } });
    }
    if (!partner.permissions || !partner.permissions.includes('mint_credential')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Partner lacks mint_credential permission.' });
    }
    if (!partner.universityId) {
      return res.status(400).json({ success: false, message: 'Partner is not linked to a universityId.' });
    }
    const { tokenId, uniqueHash, ipfsURI, recipientAccountId, degree, studentName } = req.body;
    const { Token } = require('../models');
    const token = await Token.findOne({ tokenId, universityId: partner.universityId });
    if (!token) {
      return res.status(403).json({ success: false, message: 'Forbidden: Token does not belong to your institution.' });
    }
    const mintResult = await hederaService.mintAcademicCredential(tokenId, {
      uniqueHash,
      ipfsURI,
      degree,
      studentName,
      university: partner.name,
      recipientAccountId,
    });
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
    const { Credential } = require('../models');
    await Credential.create({
      tokenId,
      serialNumber: mintResult.serialNumber,
      universityId: partner.universityId,
      studentAccountId: recipientAccountId || null,
      uniqueHash,
      ipfsURI,
    });
    res.status(201).json({ success: true, message: 'Credential minted successfully', data: { mint: mintResult, transfer: transferResult } });
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
    if (!partner.universityId) {
      return res.status(400).json({ success: false, message: 'Partner is not linked to a universityId.' });
    }
    const universityUser = await User.findById(partner.universityId);
    if (!universityUser || !universityUser.hederaAccountId) {
      return res.status(400).json({ success: false, message: 'Linked university lacks Hedera account configuration.' });
    }
    if (req.query.mock === '1' && process.env.NODE_ENV !== 'production') {
      const tokenId = '0.0.mocktoken';
      await Token.create({ tokenId, tokenName, tokenSymbol, universityId: partner.universityId });
      return res.status(201).json({ success: true, message: 'Academic token created successfully (mock)', data: { tokenId, transactionId: 'tx-mock' } });
    }
    const result = await hederaService.createAcademicToken({
      tokenName: `${universityUser.universityName} - ${tokenName}`,
      tokenSymbol,
      tokenMemo: tokenMemo || `Academic credential from ${universityUser.universityName}`,
      treasuryAccountId: universityUser.hederaAccountId,
    });
    await Token.create({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: partner.universityId });
    res.status(201).json({ success: true, message: 'Academic token created successfully', data: result });
  })
);

module.exports = router;
