const hederaService = require('../services/hederaService');
const { logger } = require('../utils/logger');

const issuanceProcessor = async (job, io) => {
  const { tokenId, credentials, universityName, universityId } = job.data;
  const roomId = `university_${universityId}`; // Room específico para el usuario
  logger.info(`Processing job ${job.id}: Batch issuance for ${credentials.length} credentials for room ${roomId}.`);

  let successful = 0;
  let failed = 0;
  const total = credentials.length;

  for (const [index, credential] of credentials.entries()) {
    try {
      await hederaService.mintAcademicCredential(tokenId, {
        ...credential,
        university: universityName,
      });
      successful++;
    } catch (error) {
      logger.error(`Error minting credential for job ${job.id}:`, error);
      failed++;
    }
    const progress = Math.round(((index + 1) / total) * 100);
    await job.updateProgress(progress);
    // Emitir progreso al room específico de la universidad
    io.to(roomId).emit('batch_progress', { jobId: job.id, progress, successful, failed, total });
  }

  const result = { successful, failed };
  // Emitir evento de completado
  io.to(roomId).emit('batch_completed', { jobId: job.id, result });

  logger.info(`✅ Job ${job.id} completed. Successful: ${successful}, Failed: ${failed}`);
  return result;
};

module.exports = { issuanceProcessor };