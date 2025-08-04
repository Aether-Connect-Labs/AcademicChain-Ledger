// src/lib/queues/credential.queue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import HederaClient from '../hedera/client';
import IPFSService from '../ipfs';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const credentialQueue = new Queue('credential-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const credentialQueueEvents = new QueueEvents('credential-queue', { connection });

export function startCredentialWorker() {
  new Worker('credential-queue', async job => {
    const { studentData, credentialData } = job.data;
    
    try {
      // 1. Subir metadata a IPFS
      const ipfsHash = await IPFSService.uploadMetadata({
        ...credentialData,
        issuedAt: new Date().toISOString(),
      });
      
      // 2. Mint NFT en Hedera
      const tokenId = await HederaClient.createAcademicToken(
        `${studentData.name}'s Diploma`,
        'DIPLOMA'
      );
      
      // 3. Asociar metadata con NFT
      const nftId = await HederaClient.mintNFT(tokenId, ipfsHash);
      
      return { nftId, ipfsHash };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }, { connection });
}