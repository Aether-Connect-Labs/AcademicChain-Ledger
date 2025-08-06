import { inject, injectable } from 'inversify';
import { CredentialRepository } from '../repositories';
import { BlockchainService } from '../services';

@injectable()
export class RevokeCredentialUseCase {
  constructor(
    @inject('CredentialRepository') private credentialRepo: CredentialRepository,
    @inject('BlockchainService') private blockchainService: BlockchainService
  ) {}

  async execute(credentialId: string, reason: string): Promise<void> {
    // 1. Obtener credencial
    const credential = await this.credentialRepo.findById(credentialId);
    if (!credential) throw new Error('Credential not found');
    if (credential.revoked) throw new Error('Credential already revoked');

    // 2. Actualizar en blockchain
    await this.blockchainService.revokeNFT(credential.nftId!, reason);

    // 3. Actualizar en base de datos
    credential.markAsRevoked();
    await this.credentialRepo.save(credential);

    // 4. Emitir evento de revocación
    await this.eventDispatcher.dispatch(
      new CredentialRevokedEvent(credentialId, reason)
    );
  }
}