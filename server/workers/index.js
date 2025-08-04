const { Worker } = require('bullmq');
const hederaService = require('../services/hederaService');
const { logger } = require('../utils/logger');
const connection = require('../queue/connection');
const { ISSUANCE_QUEUE_NAME } = require('../queue/issuanceQueue');

const initializeWorkers = (io) => {
  logger.info('🚀 Initializing Issuance Worker...');

  const worker = new Worker(ISSUANCE_QUEUE_NAME, async (job) => {
    const { tokenId, credentials, universityName, roomId } = job.data;
    logger.info(`Processing job ${job.id}: Batch issuance for ${credentials.length} credentials.`);

    let successful = 0;
    let failed = 0;

    for (const [index, credential] of credentials.entries()) {
      try {
        await hederaService.mintAcademicCredential(tokenId, {
          ...credential,
          university: universityName,
        });
        successful++;
        const progress = ((index + 1) / credentials.length) * 100;
        await job.updateProgress(progress);
        io.to(roomId).emit('progress', { jobId: job.id, progress });
      } catch (error) {
        logger.error(`Error minting credential for job ${job.id}:`, error);
        failed++;
      }
    }

    logger.info(`✅ Job ${job.id} completed. Successful: ${successful}, Failed: ${failed}`);
    return { successful, failed };
  }, { connection });

  worker.on('completed', (job, result) => {
    logger.info(`Job ${job.id} has completed with result:`, result);
    io.to(job.data.roomId).emit('completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with error:`, err.message);
    io.to(job.data.roomId).emit('failed', { jobId: job.id, error: err.message });
  });

  logger.info('✅ Issuance Worker initialized.');
};

module.exports = { initializeWorkers };
