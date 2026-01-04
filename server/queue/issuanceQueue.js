const { Queue } = require('bullmq');
const connection = require('./connection');
const logger = require('../src/utils/logger');

const ISSUANCE_QUEUE_NAME = 'credential-issuance';

let issuanceQueue;
if (connection.status === 'disabled' || (process.env.NODE_ENV || '').toLowerCase() === 'test') {
  logger.warn('Issuance queue disabled: test or Redis disabled. Using no-op queue.');
  issuanceQueue = { add: async () => ({ id: 'noop' }) };
} else {
  issuanceQueue = new Queue(ISSUANCE_QUEUE_NAME, { connection });
}

module.exports = { issuanceQueue, ISSUANCE_QUEUE_NAME };
