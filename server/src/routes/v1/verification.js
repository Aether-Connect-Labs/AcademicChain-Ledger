const router = require('express').Router();
/**
 * @swagger
 * /api/v1/verification/verify-credential:
 *   post:
 *     summary: Verifica una credencial por tokenId y serialNumber
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *                 example: "0.0.123456"
 *               serialNumber:
 *                 type: string
 *                 example: "1"
*     responses:
*       200:
*         description: Resultado de verificación
*         content:
*           application/json:
*             examples:
*               ok:
*                 value:
*                   success: true
*                   data:
*                     valid: true
*                     credential:
*                       tokenId: "0.0.123456"
*                       serialNumber: "1"
 */
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const hederaService = require('../../services/hederaServices');
const { validate } = require('../../middleware/validator');

router.post('/verify-credential', [
  body('tokenId').notEmpty().trim().escape(),
  body('serialNumber').notEmpty().trim().escape(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, serialNumber } = req.body;
  const result = await hederaService.verifyCredential(tokenId, serialNumber);
  res.status(200).json({ success: true, data: result });
}));

module.exports = router;