const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const partnerAuth = require('../middleware/partnerAuth');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaService');
const partnerService = require('../services/partnerService');
const { logger } = require('../utils/logger');
const ROLES = require('../config/roles');
const { recordAnalytics } = require('../services/analyticsService');

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
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { partnerName } = req.body;

    const { partner, apiKey } = await partnerService.generateApiKey(partnerName);

    res.status(201).json({
      success: true,
      message: `API Key generated for ${partner.name}. Please copy it now, it will not be shown again.`,
      data: {
        partnerId: partner._id,
        apiKey: apiKey, // Only show the full key on creation
      }
    });
  }));

module.exports = router;
