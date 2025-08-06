import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

@controller('/api/external')
export class ExternalController {
  @httpGet('/verify')
  async verifyCredential(req: Request, res: Response) {
    const { credentialId, apiKey } = req.query;
    
    // Validar API Key
    if (!await this.validateApiKey(apiKey as string)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Verificar credencial
    const credential = await CredentialModel.findOne({ id: credentialId });
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    return res.json({
      valid: !credential.revoked,
      credential: {
        id: credential.id,
        studentId: credential.studentId,
        institutionId: credential.institutionId,
        type: credential.type,
        issueDate: credential.issueDate,
        nftId: credential.nftId
      }
    });
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    // Implementar lógica de validación
    return true;
  }
}