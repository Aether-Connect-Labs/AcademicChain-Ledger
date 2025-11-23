const { Queue } = require('bullmq');
const connection = require('./connection');
const logger = require('../src/utils/logger');
const { isConnected } = require('./connection');

const ISSUANCE_QUEUE_NAME = 'credential-issuance';

let issuanceQueue;

if (connection.status === 'disabled' || !isConnected()) {
  logger.warn('Issuance queue disabled: Redis unavailable. Using no-op queue.');
  issuanceQueue = {
    add: async () => ({ id: 'noop' })
  };
} else {
  issuanceQueue = new Queue(ISSUANCE_QUEUE_NAME, {
    connection,
  });
}

module.exports = { issuanceQueue, ISSUANCE_QUEUE_NAME };