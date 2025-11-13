import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../server/src/utils/logger'; // Asumimos que podemos importar el logger
import { CredentialService } from '../../../server/src/services/credential.service'; // Asumimos acceso al servicio
import { ApiKeyService } from '../../../server/src/services/apiKey.service'; // Asumimos acceso al servicio

/**
 * @swagger
 * /api/v1/credentials/verify:
 *   post:
 *     summary: Verifica la validez de una credencial académica.
 *     description: |
 *       Este endpoint permite a una entidad con el rol 'employer' verificar la autenticidad
 *       de una credencial utilizando su ID de transacción de Hedera y el ID de la cuenta del titular.
 *       Requiere una API Key válida con el rol 'employer'.
 *     tags: [Credentials API]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: "El ID de la transacción de Hedera que emitió el NFT."
 *               accountId:
 *                 type: string
 *                 description: "El ID de la cuenta del titular de la credencial."
 *     responses:
 *       '200':
 *         description: Credencial verificada exitosamente.
 *       '401':
 *         description: No autorizado (API Key inválida o ausente).
 *       '403':
 *         description: Prohibido (API Key no tiene el rol 'employer').
 *       '405':
 *         description: Método no permitido.
 *       '500':
 *         description: Error interno del servidor.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Filtrar por método HTTP (equivalente a router.post)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 2. Lógica del middleware de autenticación y autorización (requireRole)
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized: API Key is missing.' });
    }

    const entity = await ApiKeyService.validateApiKey(apiKey); // Llama al servicio que valida la key
    if (!entity || entity.role !== 'employer') {
      return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }

    // 3. Lógica del controlador (CredentialApiController.verifyCredentialViaApi)
    const { transactionId, accountId } = req.body;
    const verificationResult = await CredentialService.verifyCredential(transactionId, accountId);

    return res.status(200).json(verificationResult);
  } catch (error: any) {
    logger.error('Error verifying credential via API:', { error: error.message });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}