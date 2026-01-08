const express = require('express');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const notificationService = require('../services/notificationService');
const { User } = require('../models');

const router = express.Router();

router.use(protect, authorize('university', 'institution', 'admin'));

router.post('/verify-acl-payment', [
  body('transactionId').notEmpty().trim(),
  body('tokenId').optional().isString(),
  body('treasuryAccountId').optional().isString(),
  body('expectedAmountAcl').isInt({ min: 1 }),
], validate, asyncHandler(async (req, res) => {
  const transactionId = String(req.body.transactionId).trim();
  const tokenId = String(req.body.tokenId || process.env.ACL_TOKEN_ID || '0.0.7560139');
  const treasuryAccountId = String(req.body.treasuryAccountId || process.env.TREASURY_ACCOUNT_ID || '0.0.7174400');
  const expectedAmountAcl = parseInt(req.body.expectedAmountAcl, 10);

  const reuseKey = `billing:acl:tx:${transactionId}`;
  const used = await cacheService.get(reuseKey);
  if (used) {
    return res.status(409).json({ success: false, message: 'Transacción ya utilizada' });
  }

  const mirror = process.env.HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';
  const url = `${mirror}/api/v1/transactions/${encodeURIComponent(transactionId)}`;
  let tx;
  try {
    const resp = await axios.get(url, { timeout: 15000 });
    tx = Array.isArray(resp.data?.transactions) ? resp.data.transactions[0] : resp.data;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'No se encontró la transacción en Mirror Node' });
  }

  const resultOk = String(tx?.result || '').toUpperCase().includes('SUCCESS');
  if (!resultOk) {
    return res.status(400).json({ success: false, message: 'Transacción no exitosa' });
  }

  const transfers = Array.isArray(tx?.token_transfers) ? tx.token_transfers : [];
  const toTreasury = transfers.filter(t => String(t.token_id) === tokenId && String(t.account) === treasuryAccountId);
  const amountReceived = toTreasury.reduce((a, b) => a + Math.max(0, parseInt(b.amount, 10) || 0), 0);
  if (!Number.isFinite(amountReceived) || amountReceived < expectedAmountAcl) {
    return res.status(400).json({ success: false, message: 'Monto ACL recibido insuficiente' });
  }

  const creditsGranted = Math.round(amountReceived * 1.25);
  await User.updateOne({ _id: req.user._id }, { $inc: { credits: creditsGranted } });
  await cacheService.set(reuseKey, { userId: req.user._id, creditsGranted, at: Date.now() }, 365 * 24 * 3600);

  try {
    const email = String(req.user.email || '').trim();
    if (email) {
      await notificationService.sendEmail(
        email,
        'Recarga de créditos confirmada',
        `Tu pago en ACL fue verificado. Créditos acreditados: ${creditsGranted}. Transaction ID: ${transactionId}.`
      );
    }
  } catch {}

  return res.status(200).json({ success: true, message: 'Pago verificado', data: { creditsGranted, amountReceived } });
}));

module.exports = router;
