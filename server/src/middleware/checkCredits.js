const { Token, User } = require('../models');

module.exports = async function checkCredits(req, res, next) {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ success: false, message: 'tokenId requerido' });
    const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
    const disableMongo = process.env.DISABLE_MONGO === '1';
    if (isTest || disableMongo) return next();
    const token = await Token.findOne({ tokenId }).select('universityId').lean();
    if (!token || !token.universityId) return res.status(400).json({ success: false, message: 'Token no asociado a institución' });
    const uni = await User.findById(token.universityId).select('credits isActive').lean();
    if (!uni) return res.status(404).json({ success: false, message: 'Institución no encontrada' });
    if (!uni.isActive) return res.status(403).json({ success: false, message: 'Institución pausada' });
    if (!Number.isFinite(uni.credits) || uni.credits <= 0) return res.status(402).json({ success: false, message: 'Créditos insuficientes' });
    req.universityId = String(token.universityId);
    return next();
  } catch {
    return res.status(500).json({ success: false, message: 'Error verificando créditos' });
  }
}
