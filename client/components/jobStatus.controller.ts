import { Request, Response } from 'express';
import { credentialQueueService } from '../queues/credential.queue';
import { logger } from '../utils/logger';

export class JobStatusController {

  /**
   * @description Consulta el estado de un job específico.
   * @route GET /api/v1/jobs/:jobId/status
   */
  static async getJobStatus(req: Request, res: Response): Promise<Response> {
    const { jobId } = req.params;
    const entity = req.entity!; // Entidad autenticada (institución o empleador)

    try {
      const job = await credentialQueueService.getJob(jobId);

      // Si el job no existe, devolver 404
      if (!job) {
        logger.warn(`Job status request for non-existent job`, { jobId, entityId: entity.id });
        return res.status(404).json({ error: 'Job not found.' });
      }

      // **Control de Acceso Crucial**: Asegurarse de que la entidad solo pueda ver sus propios jobs.
      const jobOwnerId = job.data.institutionId || job.data.verifierId;
      if (jobOwnerId !== entity.id) {
        logger.warn(`Forbidden access attempt to job status`, {
          jobId,
          requesterId: entity.id,
          ownerId: jobOwnerId,
        });
        // Devolvemos 404 para no revelar la existencia del job a un no autorizado.
        return res.status(404).json({ error: 'Job not found.' });
      }

      const state = await job.getState();

      // Formatear una respuesta limpia para la API
      const response = {
        jobId: job.id,
        type: job.data.type,
        status: state,
        progress: job.progress,
        attempts: job.attemptsMade,
        createdAt: new Date(job.timestamp).toISOString(),
        processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        result: null as any,
        error: null as any,
      };

      if (state === 'completed') {
        response.result = job.returnvalue;
      } else if (state === 'failed') {
        response.error = job.failedReason;
      }

      return res.status(200).json(response);

    } catch (error) {
      logger.error('Error fetching job status', {
        jobId,
        entityId: entity.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        message: 'An internal error occurred while fetching the job status.',
      });
    }
  }
}

// Exportar una instancia para usar en las rutas
export const jobStatusController = new JobStatusController();