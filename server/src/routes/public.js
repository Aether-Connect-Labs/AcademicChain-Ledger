const router = require('express').Router();
const { param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaServices');
const { recordAnalytics } = require('../services/analyticsService');
const { User } = require('../models');

router.get('/verify/:tokenId/:serial',
  [
    param('tokenId').notEmpty().trim().escape(),
    param('serial').notEmpty().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, serial } = req.params;
    const result = await hederaService.verifyCredential(tokenId, serial);
    if (result.valid && result.credential?.metadata?.attributes?.university) {
      const university = await User.findOne({ universityName: result.credential.metadata.attributes.university });
      if (university) {
        await recordAnalytics('CREDENTIAL_VERIFIED', {
          universityId: university.id,
          tokenId,
          serialNumber: serial,
          source: 'public_api'
        });
      }
    }
    res.status(200).json({ success: true, data: result });
  })
);

module.exports = router;

