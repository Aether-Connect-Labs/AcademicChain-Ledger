const router = require('express').Router();
const { body, query } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validator');
const { audit } = require('../../middleware/audit');
const rateOracle = require('../../services/rateOracle');
const ROLES = require('../../config/roles');

/**
 * @swagger
 * tags:
 *   name: Rate
 *   description: Administración del oráculo de tasa XRP ↔ HBAR
 */

/**
 * @swagger
 * /api/admin/rate:
 *   get:
 *     summary: Obtener la tasa actual y opcionalmente el historial
 *     tags: [Rate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeHistory
 *         schema: { type: string }
 *         description: "true" para incluir historial de las últimas horas
 *       - in: query
 *         name: hours
 *         schema: { type: integer, minimum: 1, maximum: 240 }
 *         description: Número de horas de historial a incluir
 *       - in: query
 *         name: raw
 *         schema: { type: string }
 *         description: "true" para respuesta cruda (debug)
 *       - in: query
 *         name: nocache
 *         schema: { type: string }
 *         description: "true" para forzar recálculo ignorando caché
 *     responses:
 *       200:
 *         description: Tasa actual con metadatos y, opcionalmente, historial
 */
router.get('/',
  protect, authorize(ROLES.ADMIN),
  [ query('includeHistory').optional().isString(), query('hours').optional().isInt({ min: 1, max: 240 }), query('raw').optional().isString(), query('nocache').optional().isString() ],
  validate,
  asyncHandler(async (req, res) => {
    const includeHistory = String(req.query.includeHistory || 'false') === 'true';
    const hours = req.query.hours || 24;
    const raw = String(req.query.raw || 'false') === 'true';
    const nocache = String(req.query.nocache || 'false') === 'true';
    const result = await rateOracle.getRate({ includeHistory, hours, raw, nocache });
    res.status(200).json(result);
  })
);

/**
 * @swagger
 * /api/admin/rate:
 *   post:
 *     summary: Aplicar override manual de la tasa
 *     tags: [Rate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rate: { type: number }
 *               reason: { type: string }
 *               expiresAt: { type: string, example: "2025-12-31T23:59:59Z" }
 *     responses:
 *       200:
 *         description: Override aplicado
 */
router.post('/',
  protect, authorize(ROLES.ADMIN), audit('RATE_OVERRIDE'),
  [ body('rate').notEmpty().isFloat({ gt: 0 }), body('reason').optional().isString(), body('expiresAt').optional().isString(), body('notify').optional().isBoolean() ],
  validate,
  asyncHandler(async (req, res) => {
    const { rate, reason, expiresAt } = req.body;
    const payload = await rateOracle.setOverride({ rate, reason, expiresAt, adminId: req.user.id });
    try {
      const io = req.app?.get('io');
      const current = await rateOracle.getRate();
      if (io && current?.data) io.emit('rate:update', current.data);
    } catch {}
    res.status(200).json({ success: true, message: 'Rate override applied successfully', data: payload });
  })
);

/**
 * @swagger
 * /api/admin/rate:
 *   delete:
 *     summary: Eliminar override manual de la tasa
 *     tags: [Rate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Override eliminado
 */
router.delete('/',
  protect, authorize(ROLES.ADMIN), audit('RATE_OVERRIDE_CLEAR'),
  asyncHandler(async (req, res) => {
    await rateOracle.clearOverride();
    try {
      const io = req.app?.get('io');
      const current = await rateOracle.getRate();
      if (io && current?.data) io.emit('rate:update', current.data);
    } catch {}
    res.status(200).json({ success: true, message: 'Rate override cleared' });
  })
);

/**
 * @swagger
 * /api/admin/rate/health:
 *   get:
 *     summary: Estado de salud del oráculo de tasa
 *     tags: [Rate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del oráculo
 */
router.get('/health',
  protect, authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const h = await rateOracle.health();
    res.status(200).json({ success: true, data: h });
  })
);

/**
 * @swagger
 * /api/admin/rate/config:
 *   get:
 *     summary: Configuración del oráculo de tasa
 *     tags: [Rate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración estática
 */
router.get('/config',
  protect, authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const cfg = rateOracle.config();
    res.status(200).json({ success: true, data: cfg });
  })
);

module.exports = router;
