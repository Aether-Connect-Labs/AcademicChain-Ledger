const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { getPrometheusMetrics } = require('../services/metricsService');
const { protect, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');
const cacheService = require('../services/cacheService');
const rateOracle = require('../services/rateOracle');
const { getUniversityInsights } = require('../services/analyticsService');

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Métricas del sistema y del oráculo de tasas
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Exporta métricas en formato Prometheus
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Texto con métricas Prometheus
 */
router.get('/', asyncHandler(async (req, res) => {
  const text = await getPrometheusMetrics();
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.status(200).send(text);
}));

/**
 * @swagger
 * /metrics/json:
 *   get:
 *     summary: Métricas en formato JSON (protegidas)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JSON con métricas del sistema y del oráculo
 */
router.get('/json', protect, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const rate = await rateOracle.getRate();
  const cacheStats = await cacheService.getStats();
  res.status(200).json({ success: true, timestamp: new Date().toISOString(), metrics: { system: {}, rates: rate, business: { cache: cacheStats } } });
}));

router.get('/insights/:universityId', protect, asyncHandler(async (req, res) => {
  const insights = await getUniversityInsights(req.params.universityId);
  res.status(200).json({ success: true, data: { insights } });
}));

router.post('/connection', protect, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const payload = {
    state: req.body.state,
    reconnects: Number(req.body.reconnects || 0),
    latencyMs: Number(req.body.latencyMs || 0),
    fallback: !!req.body.fallback,
    timestamp: req.body.timestamp || new Date().toISOString(),
    userId: req.user?.id || null,
  };
  try {
    await cacheService.set('metrics:dashboard_connection:last', JSON.stringify(payload), 120);
    await cacheService.increment('metrics:dashboard_connection_reports_total', 1);
  } catch {}
  res.status(200).json({ success: true });
}));

module.exports = router;
