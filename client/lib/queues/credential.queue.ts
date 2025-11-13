// lib/queues/credential.queue.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { 
  HederaService, 
  CredentialService, 
  IPFSService,
  EmailService 
} from '../services';
import { 
  CredentialJobData, 
  QueueJobResult, 
  QueueStatus 
} from '../types/queue.types';
import { logger } from '../utils/logger';
import { analytics } from '../utils/analytics';

// Configuración de Redis
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryDelayOnFailover: 100,
  retryDelayOnTryAgain: 100,
  lazyConnect: true
});

// Valores de configuración con defaults, permitiendo override por variables de entorno
const WORKER_CONCURRENCY = parseInt(process.env.CREDENTIAL_WORKER_CONCURRENCY || '10', 10);
const WORKER_RATE_LIMIT_MAX = parseInt(process.env.CREDENTIAL_WORKER_RATE_MAX || '50', 10);
const WORKER_RATE_LIMIT_DURATION = parseInt(process.env.CREDENTIAL_WORKER_RATE_DURATION || '1000', 10);

// Configuración de la cola
const QUEUE_CONFIG = {
  name: 'credential-queue',
  defaultJobOptions: {
    removeOnComplete: 100, // Mantener 100 jobs completados
    removeOnFail: 500,     // Aumentamos para tener más visibilidad en caso de fallos masivos
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 300000 // 5 minutos timeout
  },
  concurrency: WORKER_CONCURRENCY
};

// Instancia de la cola
export const credentialQueue = new Queue<CredentialJobData>(
  QUEUE_CONFIG.name,
  { 
    connection,
    defaultJobOptions: QUEUE_CONFIG.defaultJobOptions
  }
);

// Eventos de la cola
export const queueEvents = new QueueEvents(QUEUE_CONFIG.name, { connection });

// Tipos de trabajos disponibles
export enum CredentialJobType {
  ISSUE_SINGLE = 'issue-single',
  ISSUE_BULK = 'issue-bulk',
  VERIFY = 'verify',
  REVOKE = 'revoke',
  UPDATE = 'update'
}

// Prioridades de trabajo
export enum JobPriority {
  HIGH = 1,
  MEDIUM = 3,
  LOW = 5
}

export class CredentialQueueService {
  private static instance: CredentialQueueService;
  private worker: Worker<CredentialJobData> | null = null;
  private isWorkerRunning = false;

  private constructor() {}

  static getInstance(): CredentialQueueService {
    if (!CredentialQueueService.instance) {
      CredentialQueueService.instance = new CredentialQueueService();
    }
    return CredentialQueueService.instance;
  }

  // Inicializar el worker para procesar jobs
  async initializeWorker(): Promise<void> {
    if (this.isWorkerRunning) {
      logger.info('Credential queue worker is already running');
      return;
    }

    this.worker = new Worker<CredentialJobData>(
      QUEUE_CONFIG.name,
      async (job: Job<CredentialJobData>) => {
        return await this.processJob(job);
      },
      {
        connection,
        concurrency: WORKER_CONCURRENCY,
        limiter: {
          max: WORKER_RATE_LIMIT_MAX,
          duration: WORKER_RATE_LIMIT_DURATION
        }
      }
    );

    // Eventos del worker
    this.worker.on('completed', (job: Job<CredentialJobData>, result: any) => {
      logger.info(`✅ Job ${job.id} completed successfully`, {
        jobId: job.id,
        jobType: job.data.type,
        result
      });

      analytics.track('credential_job_completed', {
        jobId: job.id,
        jobType: job.data.type,
        duration: job.finishedOn! - job.processedOn!,
        institution: job.data.institutionId
      });
    });

    this.worker.on('failed', (job: Job<CredentialJobData> | undefined, error: Error) => {
      logger.error(`❌ Job ${job?.id} failed`, {
        jobId: job?.id,
        jobType: job?.data.type,
        error: error.message,
        stack: error.stack
      });

      analytics.track('credential_job_failed', {
        jobId: job?.id,
        jobType: job?.data.type,
        error: error.message,
        attempts: job?.attemptsMade
      });
    });

    this.worker.on('stalled', (jobId: string) => {
      logger.warn(`⚠️ Job ${jobId} stalled`);
    });

    this.worker.on('progress', (job: Job<CredentialJobData>, progress: number) => {
      logger.debug(`📊 Job ${job.id} progress: ${progress}%`);
    });

    this.isWorkerRunning = true;
    logger.info('🎯 Credential queue worker initialized and running');
  }

  // Procesar un job específico
  private async processJob(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`🚀 Processing job ${job.id} of type ${job.data.type}`, {
        jobId: job.id,
        jobType: job.data.type,
        institution: job.data.institutionId
      });

      let result: QueueJobResult;

      switch (job.data.type) {
        case CredentialJobType.ISSUE_SINGLE:
          result = await this.processSingleIssuance(job);
          break;

        case CredentialJobType.ISSUE_BULK:
          result = await this.processBulkIssuance(job);
          break;

        case CredentialJobType.VERIFY:
          result = await this.processVerification(job);
          break;

        case CredentialJobType.REVOKE:
          result = await this.processRevocation(job);
          break;

        case CredentialJobType.UPDATE:
          result = await this.processUpdate(job);
          break;

        default:
          throw new Error(`Unsupported job type: ${job.data.type}`);
      }

      const duration = Date.now() - startTime;
      
      logger.info(`✅ Job ${job.id} processed successfully in ${duration}ms`, {
        jobId: job.id,
        duration,
        result
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`❌ Job ${job.id} failed after ${duration}ms`, {
        jobId: job.id,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  // Procesar emisión individual de credencial
  private async processSingleIssuance(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    const { credentialData, institutionId, issuerAccount } = job.data;
    
    await job.updateProgress(10);

    // 1. Subir metadatos a IPFS
    const ipfsResult = await IPFSService.uploadMetadata(credentialData);
    await job.updateProgress(30);

    // 2. Registrar en Hedera
    const hederaResult = await HederaService.issueCredential({
      credentialData: {
        ...credentialData,
        ipfsHash: ipfsResult.cid
      },
      institutionId,
      issuerAccount
    });
    await job.updateProgress(70);

    // 3. Guardar en base de datos
    const dbResult = await CredentialService.saveCredential({
      ...credentialData,
      ipfsHash: ipfsResult.cid,
      transactionId: hederaResult.transactionId,
      hederaConsensusTimestamp: hederaResult.consensusTimestamp
    });
    await job.updateProgress(90);

    // 4. Enviar notificación (si está configurado)
    if (credentialData.studentEmail) {
      try {
        await EmailService.sendCredentialIssued({
          studentEmail: credentialData.studentEmail,
          studentName: credentialData.studentName,
          credentialType: credentialData.credentialType,
          institutionName: credentialData.institutionName,
          transactionId: hederaResult.transactionId,
          ipfsUrl: ipfsResult.url
        });
      } catch (emailError) {
        logger.warn('Failed to send email notification', { error: emailError });
        // No fallar el job por error de email
      }
    }

    await job.updateProgress(100);

    return {
      success: true,
      data: {
        credentialId: dbResult.id,
        transactionId: hederaResult.transactionId,
        ipfsHash: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        timestamp: new Date().toISOString()
      },
      message: 'Credential issued successfully'
    };
  }

  // Procesar emisión masiva de credenciales
  private async processBulkIssuance(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    const { bulkData, institutionId, issuerAccount } = job.data;
    
    if (!bulkData?.credentials?.length) {
      throw new Error('No credentials provided for bulk issuance');
    }

    const totalCredentials = bulkData.credentials.length;
    await job.updateProgress(5);

    // Usar addBulk para eficiencia máxima
    const jobsToAdd = bulkData.credentials.map(credentialData => ({
      name: CredentialJobType.ISSUE_SINGLE,
      data: {
        type: CredentialJobType.ISSUE_SINGLE,
        credentialData,
        institutionId,
        issuerAccount,
      } as CredentialJobData,
      opts: {
        priority: JobPriority.LOW,
        jobId: uuidv4() // Asignar un ID único a cada sub-job
      }
    }));

    await job.updateProgress(20);
    const addedJobs = await credentialQueue.addBulk(jobsToAdd);
    await job.updateProgress(100);

    const results = {
      total: totalCredentials,
      successful: addedJobs.map((job, index) => ({
        studentId: bulkData.credentials[index].studentId,
        jobId: job.id,
        status: 'queued'
      })),
      failed: [] // addBulk no falla individualmente, los errores se verán en los jobs hijos
    };

    return {
      success: true,
      data: results,
      message: `Bulk issuance of ${results.total} credentials queued successfully.`
    };
  }

  // Procesar verificación de credencial
  private async processVerification(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    const { credentialId, verifierAccount } = job.data;
    
    await job.updateProgress(20);

    // 1. Obtener credencial de la base de datos
    const credential = await CredentialService.getCredential(credentialId);
    if (!credential) {
      throw new Error(`Credential not found: ${credentialId}`);
    }
    await job.updateProgress(40);

    // 2. Verificar en Hedera
    const verificationResult = await HederaService.verifyCredential({
      transactionId: credential.transactionId!,
      verifierAccount
    });
    await job.updateProgress(80);

    // 3. Actualizar estado de verificación
    await CredentialService.updateVerificationStatus(
      credentialId, 
      verificationResult.valid
    );
    await job.updateProgress(100);

    return {
      success: true,
      data: {
        credentialId,
        valid: verificationResult.valid,
        verificationTimestamp: new Date().toISOString(),
        verifierAccount: verifierAccount?.accountId
      },
      message: verificationResult.valid 
        ? 'Credential verified successfully' 
        : 'Credential verification failed'
    };
  }

  // Procesar revocación de credencial
  private async processRevocation(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    const { credentialId, reason, revokerAccount } = job.data;
    
    await job.updateProgress(20);

    // 1. Obtener credencial
    const credential = await CredentialService.getCredential(credentialId);
    if (!credential) {
      throw new Error(`Credential not found: ${credentialId}`);
    }
    await job.updateProgress(40);

    // 2. Revocar en Hedera
    const revocationResult = await HederaService.revokeCredential({
      transactionId: credential.transactionId!,
      reason,
      revokerAccount
    });
    await job.updateProgress(70);

    // 3. Actualizar estado en base de datos
    await CredentialService.revokeCredential(credentialId, reason);
    await job.updateProgress(90);

    // 4. Notificar al estudiante (si es posible)
    if (credential.studentEmail) {
      try {
        await EmailService.sendCredentialRevoked({
          studentEmail: credential.studentEmail,
          studentName: credential.studentName,
          credentialType: credential.credentialType,
          institutionName: credential.institutionName,
          reason,
          revocationTimestamp: new Date().toISOString()
        });
      } catch (emailError) {
        logger.warn('Failed to send revocation email', { error: emailError });
      }
    }

    await job.updateProgress(100);

    return {
      success: true,
      data: {
        credentialId,
        revocationTransactionId: revocationResult.transactionId,
        reason,
        revokedAt: new Date().toISOString()
      },
      message: 'Credential revoked successfully'
    };
  }

  // Procesar actualización de credencial
  private async processUpdate(job: Job<CredentialJobData>): Promise<QueueJobResult> {
    // Implementar lógica de actualización
    await job.updateProgress(100);
    
    return {
      success: true,
      data: {},
      message: 'Credential update processed'
    };
  }

  // Métodos públicos para agregar jobs a la cola
  async addJob(data: CredentialJobData, options?: {
    priority?: JobPriority;
    delay?: number;
    jobId?: string;
  }): Promise<Job<CredentialJobData>> {
    const jobId = options?.jobId || uuidv4();
    
    const job = await credentialQueue.add(
      data.type,
      data,
      {
        jobId,
        priority: options?.priority || JobPriority.MEDIUM,
        delay: options?.delay,
        ...QUEUE_CONFIG.defaultJobOptions
      }
    );

    logger.info(`📨 Added job to queue: ${job.id}`, {
      jobId: job.id,
      jobType: data.type,
      institution: data.institutionId
    });

    analytics.track('credential_job_added', {
      jobId: job.id,
      jobType: data.type,
      institution: data.institutionId,
      priority: options?.priority
    });

    return job;
  }

  // Obtener estado de un job
  async getJobStatus(jobId: string): Promise<QueueStatus> {
    const job = await credentialQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'unknown', jobId };
    }

    const state = await job.getState();
    
    return {
      jobId,
      status: state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      timestamp: {
        created: job.timestamp,
        processed: job.processedOn,
        finished: job.finishedOn
      }
    };
  }

  // Obtener métricas de la cola
  async getQueueMetrics() {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed
    ] = await Promise.all([
      credentialQueue.getWaiting(),
      credentialQueue.getActive(),
      credentialQueue.getCompleted(),
      credentialQueue.getFailed(),
      credentialQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  // Limpiar jobs antiguos
  async cleanOldJobs(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    // Limpiar jobs completados
    await credentialQueue.clean(cutoffTime, 1000, 'completed');
    
    // Limpiar jobs fallados
    await credentialQueue.clean(cutoffTime, 1000, 'failed');

    logger.info(`🧹 Cleaned old jobs older than ${olderThanHours} hours`);
  }

  // Cerrar conexiones
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.isWorkerRunning = false;
    }
    
    await credentialQueue.close();
    await queueEvents.close();
    await connection.quit();

    logger.info('🔒 Credential queue connections closed');
  }
}

// Exportar instancia singleton
export const credentialQueueService = CredentialQueueService.getInstance();