require('dotenv').config({ path: '../.env' });
const { Worker } = require('bullmq');
const hederaService = require('../services/hederaService');
const { logger } = require('../utils/logger');
const connection = require('../queue/connection');
const { ISSUANCE_QUEUE_NAME } = require('../queue/issuanceQueue');

logger.info('🚀 Starting Issuance Worker...');

const worker = new Worker(ISSUANCE_QUEUE_NAME, async (job) => {
  const { tokenId, credentials, universityName } = job.data;
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
      await job.updateProgress(((index + 1) / credentials.length) * 100);
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
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} has failed with error:`, err);
});

hederService.connect().catch(err => {
  logger.error('Worker failed to connect to Hedera:', err);
  process.exit(1);
});