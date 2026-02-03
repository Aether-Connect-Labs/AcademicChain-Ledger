const express = require('express');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ipfsService = require('../services/ipfsService');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for memory storage (files are small enough for memory processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

/**
 * @route POST /api/upload/image
 * @desc Upload an image to IPFS
 * @access Private
 */
router.post('/image', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const { buffer, originalname, mimetype } = req.file;
    const result = await ipfsService.pinFile(buffer, originalname, mimetype);

    res.status(200).json({
      success: true,
      data: {
        ipfsHash: result.IpfsHash,
        ipfsURI: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`, // Or use utils/ipfsUtils gateway logic in client
      }
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload to IPFS' });
  }
}));

module.exports = router;
