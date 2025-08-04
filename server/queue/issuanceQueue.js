const { Queue } = require('bullmq');
const connection = require('./connection');

const ISSUANCE_QUEUE_NAME = 'credential-issuance';

const issuanceQueue = new Queue(ISSUANCE_QUEUE_NAME, {
  connection,
});

module.exports = { issuanceQueue, ISSUANCE_QUEUE_NAME };