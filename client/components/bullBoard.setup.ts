import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { credentialQueue } from '../queues/credential.queue';
import { logger } from '../utils/logger';

/**
 * Configura y devuelve el router para el dashboard de Bull Board.
 * @returns El router de Express para el dashboard.
 */
export const setupBullBoard = () => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/jobs'); // Ruta base para el dashboard

  createBullBoard({
    queues: [new BullMQAdapter(credentialQueue)],
    serverAdapter: serverAdapter,
  });

  logger.info('📊 Bull Board dashboard configured at /admin/jobs');

  return serverAdapter.getRouter();
};

// Middleware de autenticación de admin (placeholder)
// En una app real, esto verificaría la sesión del admin.
export const adminUiAuth = (req: any, res: any, next: any) => {
  // Aquí iría la lógica para verificar si el usuario de la sesión es un admin.
  // Por ejemplo: if (req.session.user && req.session.user.role === 'admin')
  next();
};