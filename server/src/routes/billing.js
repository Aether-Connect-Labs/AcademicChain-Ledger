const express = require('express');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { distributeFunds } = require('../services/paymentDistributor');
const xrpService = require('../services/xrpService');
const rateOracle = require('../services/rateOracle');

const router = express.Router();

const PLANS = {
  'starter': { priceUsd: 100, credits: 100 },
  'business': { priceUsd: 450, credits: 500 },
  'enterprise': { priceUsd: 800, credits: 1000 }
};

// --- WEBHOOKS (Públicos) ---

/**
 * Webhook de Banxa
 * Recibe confirmación de pago y distribuye fondos automáticamente.
 */
router.post('/webhook/banxa', asyncHandler(async (req, res) => {
    // 1. Validación básica de seguridad (En prod: verificar firma HMAC)
    const { status, external_reference, coin_amount, tx_hash } = req.body;

    console.log(`📩 Webhook Banxa recibido. Status: ${status}, Ref: ${external_reference}`);

    if (status !== 'completed' && status !== 'success') {
        return res.status(200).json({ message: 'Status not completed, ignoring.' });
    }

    // 2. Verificar usuario
    const universityId = external_reference;
    const user = await User.findById(universityId);
    if (!user) {
        console.error(`❌ Webhook Error: Usuario no encontrado (ID: ${universityId})`);
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    try {
        // 3. Distribuir Fondos (Motor de Seguridad)
        // coin_amount suele venir como string, aseguramos float
        const amountXRP = parseFloat(coin_amount || '0');
        
        if (amountXRP > 0) {
            await distributeFunds(amountXRP, universityId);
            
            // 4. Acreditar en Plataforma (Opcional, si paymentDistributor no lo hace)
            // Asumimos que distributeFunds maneja la parte financiera externa.
            // Aquí actualizamos el saldo interno si es necesario, o lo dejamos para otro proceso.
            // Por consistencia con la recarga ACL, damos créditos aquí también:
            // Ejemplo: 1 XRP = 1 Crédito (Ajustar tasa real)
            const creditsToAdd = Math.floor(amountXRP * 1.5); // Tasa ejemplo
            user.credits += creditsToAdd;
            await user.save();
            
            console.log(`✅ Créditos actualizados para ${user.email}: +${creditsToAdd}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error procesando webhook:", error);
        // Retornar 500 para que Banxa reintente
        res.status(500).json({ success: false, message: 'Internal Error' });
    }
}));

// --- RUTAS PROTEGIDAS ---
router.use(protect, authorize('university', 'institution', 'admin'));

router.get('/xrp-price', asyncHandler(async (req, res) => {
    const rateData = await rateOracle.getRate();
    res.json({ 
        success: true, 
        price: rateData.data.xrpUsd || 0.5, // Fallback safe
        rate: rateData.data.rate 
    });
}));

router.post('/verify-xrp-payment', [
  body('transactionId').notEmpty().trim(),
  body('planId').isIn(Object.keys(PLANS)),
], validate, asyncHandler(async (req, res) => {
  const { transactionId, planId } = req.body;
  const plan = PLANS[planId];
  
  const reuseKey = `billing:xrp:tx:${transactionId}`;
  const used = await cacheService.get(reuseKey);
  if (used) {
    return res.status(409).json({ success: false, message: 'Transacción ya utilizada' });
  }

  // Get Exchange Rate
  const rateData = await rateOracle.getRate();
  const xrpPrice = rateData.data.xrpUsd;
  
  if (!xrpPrice) {
      // Si falla el oráculo, usar un fallback seguro o permitir bypass en dev
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Rate Oracle failed, using fallback rate 0.5 USD/XRP for dev');
      } else {
        return res.status(503).json({ success: false, message: 'No se pudo obtener el precio de XRP' });
      }
  }
  
  const effectivePrice = xrpPrice || 0.5;
  const requiredXrp = plan.priceUsd / effectivePrice;
  // Allow small margin of error (e.g. 1%) due to rate fluctuations
  const minXrp = requiredXrp * 0.99;

  // Verify
  await xrpService.connect();
  const verification = await xrpService.verifyPayment({
      txHash: transactionId,
      minDrops: Math.floor(minXrp * 1000000)
  });

  if (!verification.verified) {
      // En entorno de prueba, si no hay conexión real, podríamos simular éxito si el hash empieza con 'mock'
      if (process.env.NODE_ENV !== 'production' && transactionId.startsWith('mock')) {
         // Pass through for demo
      } else {
        return res.status(400).json({ 
            success: false, 
            message: 'Pago no verificado o insuficiente',
            details: { 
                received: verification.amountDrops / 1000000, 
                required: requiredXrp,
                currentRate: effectivePrice
            }
        });
      }
  }

  // Grant Credits + Bonus (10%)
  const creditsGranted = Math.round(plan.credits * 1.10);

  // Update User
  await User.updateOne({ _id: req.user._id }, { $inc: { credits: creditsGranted } });
  
  // Sync with Partner if linked
  await Partner.updateMany({ universityId: req.user._id }, { $inc: { credits: creditsGranted } });

  // Cache
  await cacheService.set(reuseKey, { userId: req.user._id, creditsGranted, at: Date.now() }, 365 * 24 * 3600);

  // Notify
   try {
    const email = String(req.user.email || '').trim();
    if (email) {
      await notificationService.sendEmail(
        email,
        'Recarga de créditos XRP confirmada',
        `Tu pago en XRP fue verificado. Créditos acreditados: ${creditsGranted}.`
      );
    }
    
    // Automation Trigger
    await automationService.triggerEvent('credits_recharged_xrp', {
        userId: req.user._id,
        email: req.user.email,
        credits: creditsGranted,
        txHash: transactionId,
        amountXrp: verification.amountDrops / 1000000
    });
  } catch {}

  return res.status(200).json({ success: true, message: 'Pago verificado', data: { creditsGranted } });
}));

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
  // Handle transaction ID format (0.0.x@seconds.nanoseconds -> 0.0.x-seconds-nanoseconds)
  const formattedTxId = transactionId.replace('@', '-').replace('.', '-');
  const url = `${mirror}/api/v1/transactions/${formattedTxId}`;
  
  let tx;
  try {
    const resp = await axios.get(url, { timeout: 15000 });
    tx = Array.isArray(resp.data?.transactions) ? resp.data.transactions[0] : resp.data;
  } catch (e) {
    console.error('Mirror Node Error:', e.message);
    return res.status(400).json({ success: false, message: 'No se encontró la transacción en Mirror Node' });
  }

  const resultOk = String(tx?.result || '').toUpperCase().includes('SUCCESS');
  if (!resultOk) {
    return res.status(400).json({ success: false, message: 'Transacción no exitosa o fallida' });
  }

  const transfers = Array.isArray(tx?.token_transfers) ? tx.token_transfers : [];
  const toTreasury = transfers.filter(t => String(t.token_id) === tokenId && String(t.account_id || t.account) === treasuryAccountId);
  const amountReceived = toTreasury.reduce((a, b) => a + Math.max(0, parseInt(b.amount, 10) || 0), 0);
  
  if (!Number.isFinite(amountReceived) || amountReceived < expectedAmountAcl) {
    return res.status(400).json({ 
      success: false, 
      message: `Monto ACL recibido insuficiente. Esperado: ${expectedAmountAcl}, Recibido: ${amountReceived}` 
    });
  }

  const creditsGranted = Math.round(amountReceived * 1.25);
  
  // Update User credits
  await User.updateOne({ _id: req.user._id }, { $inc: { credits: creditsGranted } });
  
  // Sync with Partner if linked
  await Partner.updateMany({ universityId: req.user._id }, { $inc: { credits: creditsGranted } });

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

    // Automation Trigger
    await automationService.triggerEvent('credits_recharged_acl', {
        userId: req.user._id,
        email: req.user.email,
        credits: creditsGranted,
        txId: transactionId,
        amountAcl: amountReceived
    });
  } catch {}

  return res.status(200).json({ success: true, message: 'Pago verificado', data: { creditsGranted, amountReceived } });
}));

// Función para generar el link de Banxa (Simulación de Staging)
router.post('/create-payment-intent', async (req, res) => {
    // Si no viene en body, intentamos usar el usuario autenticado
    const universityId = req.body.universityId || (req.user ? req.user._id : 'unknown-uni');
    const { planId, amountFiat } = req.body;

    try {
        // 1. Creamos un ID único de transacción para rastrear este pago
        const transactionId = `TX-${Date.now()}-${universityId}`;

        // 2. Preparamos el Payload para Banxa
        // El 'external_reference' es clave: es el ID que recibiremos de vuelta para saber a quién darle los créditos
        const paymentData = {
            source_fiat_amount: amountFiat,
            source_fiat_code: 'USD',
            target_coin_code: 'XRP', // Aquí es donde decides recibir XRP
            external_reference: universityId,
            return_url_on_success: 'https://tu-plataforma.com/dashboard?payment=success',
            wallet_address: process.env.WALLET_XRP_RECAUDACION || 'rSimulatedWalletAddressForBanxa' // Tu Cuenta A
        };

        /* LOGICA CUANDO TENGAS LA API:
        Aquí harías un fetch a 'https://api.banxa.com/api/orders'
        firmando el request con tu BANXA_API_SECRET.
        */

        // 3. Simulamos la respuesta de Banxa para que puedas seguir programando
        const banxaKey = process.env.BANXA_API_KEY || 'test-banxa-key';
        const mockCheckoutUrl = `https://checkout.banxa.com/?apiKey=${banxaKey}&amount=${amountFiat}&ref=${transactionId}`;

        console.log(`🎫 Intención de pago creada para Uni: ${universityId}. ID: ${transactionId}`);
        
        res.status(200).json({ 
            success: true,
            checkoutUrl: mockCheckoutUrl,
            transactionId
        });

    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ success: false, message: 'Error creando intento de pago' });
    }
});

module.exports = router;
