import { Request, Response } from 'express';
import { credentialQueueService, CredentialJobType, JobPriority } from '../queues/credential.queue';
import { logger } from '../utils/logger';
import { validationService } from '../services/validationService'; // Asumimos que existe

export class CredentialApiController {

  /**
   * @description Inicia un proceso de emisión masiva de credenciales a través de la API.
   * @route POST /api/v1/credentials/issue-bulk
   */
  static async issueBulkViaApi(req: Request, res: Response): Promise<Response> {
    const institutionId = req.entity!.id; // Obtenido del middleware de autenticación y autorización
    const { credentials, config } = req.body;

    // 1. Validación robusta de la entrada
    const { isValid, errors } = validationService.validateApiBulkIssuance(req.body);
    if (!isValid) {
      logger.warn('Invalid bulk issuance API request', { institutionId, errors });
      return res.status(400).json({
        message: 'Invalid request body.',
        errors,
      });
    }

    try {
      // 2. Crear el payload para el job
      const jobData = {
        type: CredentialJobType.ISSUE_BULK,
        bulkData: {
          credentials,
        },
        institutionId,
        // El issuerAccount podría venir de la configuración de la institución
        // o de un pool de cuentas gestionado por el sistema.
        issuerAccount: { accountId: process.env.HEDERA_OPERATOR_ID! },
        issuanceConfig: config,
      };

      // 3. Añadir el job maestro a la cola con alta prioridad
      const job = await credentialQueueService.addJob(jobData, {
        priority: JobPriority.HIGH, // Las solicitudes de API tienen alta prioridad
      });

      logger.info(`Bulk issuance job [${job.id}] queued via API for institution [${institutionId}]`, {
        jobId: job.id,
        institutionId,
        credentialCount: credentials.length,
      });

      // 4. Devolver una respuesta inmediata con el ID del job para seguimiento
      return res.status(202).json({
        message: 'Batch issuance process has been accepted and queued.',
        jobId: job.id,
        statusUrl: `/api/v1/jobs/${job.id}/status`,
        credentialCount: credentials.length,
      });

    } catch (error) {
      logger.error('Failed to queue bulk issuance job via API', {
        institutionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        message: 'An internal error occurred while queuing the issuance process.',
      });
    }
  }

  /**
   * @description Inicia un proceso de verificación de credencial a través de la API.
   * @route POST /api/v1/credentials/verify
   */
  static async verifyCredentialViaApi(req: Request, res: Response): Promise<Response> {
    const verifier = req.entity!; // Empleador, obtenido del middleware
    const { credentialId } = req.body;

    // 1. Validación de la entrada
    if (!credentialId || typeof credentialId !== 'string') {
      logger.warn('Invalid verification API request: missing credentialId', { verifierId: verifier.id });
      return res.status(400).json({
        message: 'Invalid request body. "credentialId" is required.',
      });
    }

    try {
      // 2. Crear el payload para el job de verificación
      const jobData = {
        type: CredentialJobType.VERIFY,
        credentialId,
        verifierId: verifier.id, // <-- AÑADIDO: Guardar quién está verificando
        // La cuenta del verificador podría ser una cuenta genérica del sistema
        // o una específica para la entidad empleadora.
        verifierAccount: { accountId: process.env.HEDERA_OPERATOR_ID! },
      };

      // 3. Añadir el job a la cola con la máxima prioridad
      const job = await credentialQueueService.addJob(jobData, {
        priority: JobPriority.HIGH,
      });

      logger.info(`Verification job [${job.id}] queued via API for verifier [${verifier.name}]`, {
        jobId: job.id,
        verifierId: verifier.id,
        credentialId,
      });

      // 4. Devolver una respuesta inmediata con el ID del job
      return res.status(202).json({
        message: 'Verification process has been accepted and queued.',
        jobId: job.id,
        statusUrl: `/api/v1/jobs/${job.id}/status`,
      });

    } catch (error) {
      logger.error('Failed to queue verification job via API', { verifierId: verifier.id, error });
      return res.status(500).json({ message: 'An internal error occurred while queuing the verification.' });
    }
  }
}