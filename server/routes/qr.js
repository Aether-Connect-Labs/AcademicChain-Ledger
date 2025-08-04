const express = require('express');
const { body, param } = require('express-validator');
const QRCode = require('qrcode');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const ROLES = require('../config/roles');

const router = express.Router();

const generateQrData = (type, tokenId, serialNumber) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const verificationUrl = `${baseUrl}/api/verification/verify/${tokenId}/${serialNumber}`;

  switch (type) {
    case 'wallet':
      return `hedera://${tokenId}/${serialNumber}`;
    case 'certificate':
      return JSON.stringify({
        type: 'academic_credential',
        tokenId,
        serialNumber,
        verificationUrl,
        timestamp: new Date().toISOString()
      });
    case 'verification':
    default:
      return verificationUrl;
  }
};

/**
 * @route   POST /api/qr/generate
 * @desc    Generate QR code for credential verification
 * @access  Public
 */
router.post('/generate', [
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('serialNumber').notEmpty().withMessage('Serial number is required'),
  body('type').optional().isIn(['verification', 'wallet', 'certificate']).withMessage('Invalid QR type')
], validate, asyncHandler(async (req, res) => {
    const { tokenId, serialNumber, type = 'verification', options } = req.body;
    const qrData = generateQrData(type, tokenId, serialNumber);

    let qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      ...options
    };

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, qrOptions);

    logger.info(`📱 QR code generated for ${tokenId}:${serialNumber} (type: ${type})`);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode: qrCodeDataUrl,
        verificationUrl: generateQrData('verification', tokenId, serialNumber),
        tokenId,
        serialNumber,
        type,
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        }
      }
    });

}));

/**
 * @route   GET /api/qr/generate/:tokenId/:serialNumber
 * @desc    Generate QR code via URL parameters
 * @access  Public
 */
router.get('/generate/:tokenId/:serialNumber', [
  param('tokenId').notEmpty().withMessage('Token ID is required'),
  param('serialNumber').notEmpty().withMessage('Serial number is required'),
], validate, asyncHandler(async (req, res) => {
    const { tokenId, serialNumber } = req.params;
    const { type = 'verification', format = 'png', ...options } = req.query;
    const qrData = generateQrData(type, tokenId, serialNumber);

    let qrOptions = {
      errorCorrectionLevel: 'M',
      type: `image/${format}`,
      quality: 0.92,
      margin: 1,
      ...options
    };

    // Generate QR code
    if (format === 'svg') {
      const qrCodeSvg = await QRCode.toString(qrData, {
        ...qrOptions,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(qrCodeSvg);
    } else {
      const qrCodeBuffer = await QRCode.toBuffer(qrData, qrOptions);
      
      res.setHeader('Content-Type', `image/${format}`);
      res.setHeader('Content-Disposition', `inline; filename="academicchain-ledger-${tokenId}-${serialNumber}.${format}"`);
      return res.send(qrCodeBuffer);
    }

}));

/**
 * @route   POST /api/qr/batch-generate
 * @desc    Generate multiple QR codes in batch
 * @access  Public
 */
router.post('/batch-generate',
  protect,
  authorize(ROLES.UNIVERSITY, ROLES.ADMIN),
  [body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { credentials, type = 'verification', options = {} } = req.body;

    const results = [];
    const qrErrors = [];

    // Process each credential
    for (const { tokenId, serialNumber } of credentials) {
      try {
        const qrData = generateQrData(type, tokenId, serialNumber);
        let qrOptions = {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          ...options
        };

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, qrOptions);

        results.push({
          tokenId,
          serialNumber,
          qrCode: qrCodeDataUrl,
          verificationUrl: generateQrData('verification', tokenId, serialNumber),
          type
        });

      } catch (error) {
        qrErrors.push({
          credential: { tokenId, serialNumber },
          error: error.message
        });
      }
    }

    logger.info(`📱 Batch QR generation completed: ${results.length} successful, ${qrErrors.length} failed`);

    res.status(200).json({
      success: true,
      message: 'Batch QR generation completed',
      data: {
        qrCodes: results,
        failed: qrErrors,
        summary: {
          total: credentials.length,
          successful: results.length,
          failed: qrErrors.length
        }
      }
    });

  }));

/**
 * @route   POST /api/qr/scan
 * @desc    Process scanned QR code data
 * @access  Public
 */
router.post('/scan', [body('qrData').notEmpty().withMessage('QR data is required')], validate, asyncHandler(async (req, res) => {
    const { qrData } = req.body;

    let parsedData;
    let scanType = 'unknown';

    // Try to parse as JSON first (certificate type)
    try {
      parsedData = JSON.parse(qrData);
      scanType = 'certificate';
    } catch (e) {
      // Check if it's a verification URL
      if (qrData.includes('/api/verification/verify/')) {
        const urlParts = qrData.split('/');
        const tokenId = urlParts[urlParts.length - 2];
        const serialNumber = urlParts[urlParts.length - 1];
        
        parsedData = { tokenId, serialNumber };
        scanType = 'verification';
      } else if (qrData.startsWith('hedera://')) {
        // Wallet format
        const parts = qrData.replace('hedera://', '').split('/');
        parsedData = {
          tokenId: parts[0],
          serialNumber: parts[1]
        };
        scanType = 'wallet';
      } else {
        throw new Error('Unsupported QR code format. Please use a valid AcademicChain Ledger QR code.');
      }
    }

    logger.info(`📱 QR code scanned: ${scanType} format`);

    res.status(200).json({
      success: true,
      message: 'QR code processed successfully',
      data: {
        scanType,
        parsedData,
        originalData: qrData,
        timestamp: new Date().toISOString()
      }
    });

}));

/**
 * @route   GET /api/qr/templates
 * @desc    Get available QR code templates
 * @access  Public
 */
router.get('/templates', asyncHandler(async (req, res) => {
    const templates = {
      verification: {
        name: 'Verification QR',
        description: 'Direct link to credential verification page',
        format: 'URL',
        example: '/api/verification/verify/{tokenId}/{serialNumber}'
      },
      wallet: {
        name: 'Wallet QR',
        description: 'Hedera wallet integration format',
        format: 'hedera://{tokenId}/{serialNumber}',
        example: 'hedera://0.0.123456/1'
      },
      certificate: {
        name: 'Certificate QR',
        description: 'Rich metadata with verification information',
        format: 'JSON',
        example: {
          type: 'academic_credential',
          tokenId: '0.0.123456',
          serialNumber: '1',
          verificationUrl: 'https://...',
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      }
    };

    res.status(200).json({
      success: true,
      message: 'QR templates retrieved successfully',
      data: templates
    });

}));

module.exports = router;