const { Worker } = require('bullmq');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const algorandService = require('../services/algorandService');
const veramoSecure = require('../services/veramoSecure');
const { Credential } = require('../models');
const logger = require('../utils/logger');
const connection = require('../../queue/connection');
const { ISSUANCE_QUEUE_NAME } = require('../../queue/issuanceQueue');

const initializeWorkers = (io) => {
  logger.info('🚀 Initializing Issuance Worker...');

  const worker = new Worker(ISSUANCE_QUEUE_NAME, async (job) => {
    // Handler for Retry Anchor Jobs
    if (job.name === 'retry-anchor') {
        const { type, credentialData, universityName } = job.data;
        logger.info(`Processing job ${job.id}: Retry ${type} anchor for ${credentialData.uniqueHash}`);
        
        try {
            if (type === 'xrp') {
                await xrpService.connect();
                const anchorTitle = credentialData.studentName ? `${credentialData.degree} - ${credentialData.studentName} - ${universityName}` : `${credentialData.degree || 'Credential'} - ${universityName}`;
                await xrpService.anchor({
                    certificateHash: credentialData.uniqueHash,
                    hederaTokenId: credentialData.tokenId,
                    serialNumber: 'pending', // or fetch actual serial if available
                    hederaTopicId: credentialData.hederaTopicId,
                    hederaSequence: credentialData.hederaSequence,
                    timestamp: new Date().toISOString(),
                    title: anchorTitle,
                    issuer: universityName,
                    cid: credentialData.cid
                });
                logger.info(`✅ Retry XRP Anchor successful for ${credentialData.uniqueHash}`);
            } else if (type === 'algorand') {
                await algorandService.connect();
                await algorandService.anchor({
                    certificateHash: credentialData.uniqueHash,
                    hederaTokenId: credentialData.tokenId,
                    serialNumber: 'pending',
                    timestamp: new Date().toISOString(),
                    cid: credentialData.cid
                });
                logger.info(`✅ Retry Algorand Anchor successful for ${credentialData.uniqueHash}`);
            }
            return { success: true };
        } catch (error) {
            logger.error(`❌ Retry ${type} failed: ${error.message}`);
            throw error; // Let BullMQ handle retries/failure
        }
    }

    // Default: Bulk Issuance
    const { tokenId, credentials, universityName, universityId, roomId, universityDid, institutionId, ipAddress } = job.data;
    logger.info(`Processing job ${job.id}: Batch issuance for ${credentials.length} credentials.`);
    
    // Lazy load AuditLog to avoid circular dependencies if any
    const AuditLog = require('../models/AuditLog');

    let successful = 0;
    let failed = 0;

    for (const [index, credentialData] of credentials.entries()) {
      try {
        // Get next Global Status List Index
        // Note: In a high-concurrency production environment, use a Redis counter or atomic DB update to avoid race conditions.
        let statusListIndex = 0;
        try {
             const Sequence = require('../models/Sequence');
             statusListIndex = await Sequence.getNext('statusListIndex');
        } catch (e) {
             logger.warn(`Failed to get next statusListIndex in worker (using fallback): ${e.message}`);
             const lastCred = await Credential.findOne({ statusListIndex: { $exists: true } }).sort({ statusListIndex: -1 });
             statusListIndex = (lastCred && typeof lastCred.statusListIndex === 'number') ? lastCred.statusListIndex + 1 : 0;
        }

        const mintResult = await hederaService.mintAcademicCredential(tokenId, {
          ...credentialData,
          university: universityName,
        });

        // Generate VC
        let vcJwt = null;
        try {
            const agent = veramoSecure.getBaseAgent();
            const vc = await agent.createVerifiableCredential({
                credential: {
                    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
                    type: ['VerifiableCredential', 'AcademicCredential'],
                    issuer: { id: universityDid || `did:web:localhost:3001` }, 
                    issuanceDate: new Date().toISOString(),
                    credentialStatus: {
                        id: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list#${statusListIndex}`,
                        type: 'StatusList2021Entry',
                        statusPurpose: 'revocation',
                        statusListIndex: statusListIndex,
                        statusListCredential: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list`
                    },
                    credentialSubject: {
                        id: credentialData.recipientAccountId ? `did:pkh:hedera:testnet:${credentialData.recipientAccountId}` : `did:web:example.com:${(credentialData.studentName||'student').replace(/\s+/g, '')}`,
                        degree: credentialData.degree || 'Academic Credential',
                        studentName: credentialData.studentName,
                        university: universityName,
                        uniqueHash: credentialData.uniqueHash,
                        ipfsURI: credentialData.ipfsURI,
                        tokenId: tokenId,
                        serialNumber: mintResult.serialNumber
                    }
                },
                proofFormat: 'jwt',
                save: false
            });
            vcJwt = typeof vc === 'string' ? vc : (vc.proof && vc.proof.jwt ? vc.proof.jwt : JSON.stringify(vc));
        } catch (e) {
            logger.warn(`Failed to generate VC in worker: ${e.message}`);
        }

        // Save to DB
        if (universityId) {
            try {
                await Credential.create({
                    tokenId,
                    serialNumber: mintResult.serialNumber,
                    universityId,
                    studentAccountId: credentialData.recipientAccountId || null,
                    uniqueHash: credentialData.uniqueHash,
                    ipfsURI: credentialData.ipfsURI,
                    vcJwt,
                    statusListIndex, // Save the global index
                    // externalProofs: ... (skipped for now in worker to avoid complexity/latency)
                });

                // Create Audit Log
                if (institutionId) {
                   await AuditLog.create({
                       institutionId: institutionId,
                       action: 'CREDENTIAL_ISSUED',
                       ipAddress: ipAddress || 'unknown',
                       documentHash: credentialData.uniqueHash,
                       cid: credentialData.ipfsURI ? credentialData.ipfsURI.replace('ipfs://', '') : 'unknown',
                       timestamp: new Date(),
                       details: {
                           tokenId,
                           serialNumber: mintResult.serialNumber,
                           isBulk: true,
                           jobId: job.id
                       }
                   });
                }
            } catch (dbErr) {
                logger.error(`Failed to save credential to DB in worker: ${dbErr.message}`);
            }
        }

        successful++;
        const progress = ((index + 1) / credentials.length) * 100;
        await job.updateProgress(progress);
        io.to(String(job.id)).emit('job-progress', { jobId: job.id, progress });
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
    io.to(String(job.id)).emit('job-completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with error:`, err.message);
    io.to(String(job.id)).emit('job-failed', { jobId: job.id, error: err.message });
  });

  logger.info('✅ Issuance Worker initialized.');
};

module.exports = { initializeWorkers };
