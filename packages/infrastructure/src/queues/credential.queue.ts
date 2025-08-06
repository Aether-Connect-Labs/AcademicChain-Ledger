// packages/infrastructure/src/queues/credential.queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { HederaService } from '../blockchain';
import { IPFSService } from '../storage';

const connection = new IORedis(process.env.REDIS_URL!);

export const credentialQueue = new Queue('credential-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

export function startCredentialWorker() {
  new Worker('credential-queue', async job => {
    const { credentialId } = job.data;
    const hedera = new HederaService();
    
    try {
      // 1. Obtener credencial de la DB
      const credential = await CredentialModel.findOne({ id: credentialId });
      if (!credential) throw new Error('Credential not found');
      
      // 2. Subir metadata a IPFS
      const metadata = {
        studentId: credential.studentId,
        institutionId: credential.institutionId,
        type: credential.type,
        issueDate: credential.issueDate
      };
      const ipfsHash = await IPFSService.upload(metadata);
      
      // 3. Mint NFT en Hedera
      const nftId = await hedera.mintNFT(credential.id, ipfsHash);
      
      // 4. Actualizar credencial
      credential.nftId = nftId;
      credential.metadataUri = `ipfs://${ipfsHash}`;
      await credential.save();
      
      return { nftId, ipfsHash };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }, { connection });
}