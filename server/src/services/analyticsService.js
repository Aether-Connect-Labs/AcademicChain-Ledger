// Usaremos una colección/tabla para eventos de analítica
const { AnalyticsEvent, Token, User } = require('../models');

/**
 * Registra un evento significativo en el sistema.
 * @param {string} eventType - Ej: 'credential_minted', 'qr_verification', 'partner_verification'.
 * @param {object} metadata - Datos relevantes sobre el evento.
 */
const recordAnalytics = async (eventType, metadata) => {
  try {
    if (!AnalyticsEvent || typeof AnalyticsEvent !== 'function') return;
    const event = new AnalyticsEvent({ type: eventType, data: metadata, timestamp: new Date() });
    await event.save();
  } catch {}
};

/**
 * Genera insights a partir de los datos agregados.
 * @param {string} universityId - El ID de la universidad para filtrar los datos.
 * @returns {object} - Un objeto con estadísticas clave.
 */
const getUniversityInsights = async (universityId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Con `Promise.all` se ejecutan las consultas en paralelo para mayor eficiencia.
  const hasAnalytics = AnalyticsEvent && typeof AnalyticsEvent === 'function';
  const [
    totalCredentialsIssued,
    verificationsThisMonth,
    activeTokens,
    recentActivity
  ] = await Promise.all([
    hasAnalytics ? AnalyticsEvent.countDocuments({ type: 'CREDENTIAL_MINTED', 'data.universityId': universityId }) : Promise.resolve(0),
    hasAnalytics ? AnalyticsEvent.countDocuments({ type: { $in: ['CREDENTIAL_VERIFIED', 'PARTNER_VERIFICATION'] }, 'data.universityId': universityId, timestamp: { $gte: thirtyDaysAgo } }) : Promise.resolve(0),
    Token.countDocuments({ universityId: universityId }),
    hasAnalytics ? AnalyticsEvent.find({ 'data.universityId': universityId }).sort({ timestamp: -1 }).limit(5).select('type data timestamp') : Promise.resolve([])
  ]);

  return {
    totalCredentialsIssued,
    verificationsThisMonth,
    activeTokens,
    recentActivity: recentActivity.map(event => ({
      type: event.type,
      details: event.data,
      date: event.timestamp
    })),
  };
};

module.exports = { recordAnalytics, getUniversityInsights };