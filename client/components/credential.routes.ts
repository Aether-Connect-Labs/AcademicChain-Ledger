import { Router } from 'express';
import { CredentialApiController } from '../controllers/credential.controller';
import { requireRole, requireAuth } from '../middlewares/apiAuth.middleware';
import { jobStatusController } from '../controllers/jobStatus.controller'; // Asumimos que existe

const router = Router();

/**
 * =============================================================================
 *  API Routes for Credential Management (v1)
 * =============================================================================
 *
 * Todos los endpoints aquí están protegidos y requieren una API Key válida.
 * Se utiliza el middleware `requireRole` para asegurar que la entidad
 * que realiza la llamada tiene los permisos adecuados.
 */

// Ruta para la emisión masiva de credenciales.
// **Solo accesible para entidades con el rol 'institution'.**
router.post(
  '/credentials/issue-bulk', 
  requireRole('institution'), 
  CredentialApiController.issueBulkViaApi
);

// Ruta para la verificación de credenciales.
// **Solo accesible para entidades con el rol 'employer'.**
router.post(
  '/credentials/verify',
  requireRole('employer'),
  CredentialApiController.verifyCredentialViaApi
);

// Ruta para consultar el estado de un job.
// **Accesible para cualquier entidad autenticada.** La autorización se hace en el controlador.
router.get('/jobs/:jobId/status', requireAuth, jobStatusController.getJobStatus);

export default router;