const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const hederaService = require('../services/hederaServices');
const { logger } = require('../utils/logger');
const { protect, isUniversity} = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/token-info/:tokenId',
  [param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape()],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const result = await hederaService.getTokenInfo(tokenId);
    res.status(200).json({ "success": true, "data": result });
  })
);

router.get('/balance/:accountId',
  [param('accountId').notEmpty().withMessage('Account ID is required').trim().escape()],
  validate,
  asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const result = await hederaService.getAccountBalance(accountId);
    res.status(200).json({ "success": true, "data": result });
  })
);

module.exports = router;
