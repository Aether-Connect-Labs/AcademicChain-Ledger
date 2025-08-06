// packages/infrastructure/src/services/dispute-resolution.service.ts
import { injectable } from 'inversify';
import { HederaService } from './hedera.service';
import { ContractService } from './contract.service';

@injectable()
export class DisputeResolutionService {
  private readonly arbitrationContract: string;
  private readonly arbitrationFee = 100; // 100 HASGRADT

  constructor(
    private hederaService: HederaService,
    private contractService: ContractService
  ) {
    this.arbitrationContract = process.env.ARBITRATION_CONTRACT_ADDRESS!;
  }

  async initiateDispute(
    credentialId: string,
    reason: DisputeReason,
    evidence: DisputeEvidence[],
    complainant: string
  ): Promise<DisputeCase> {
    // 1. Verificar propiedad o derecho para disputar
    const hasStanding = await this.checkStanding(complainant, credentialId);
    if (!hasStanding) {
      throw new Error('You do not have standing to dispute this credential');
    }

    // 2. Cobrar tarifa de arbitraje
    await this.hederaService.transferToken(
      complainant,
      process.env.ARBITRATION_TREASURY!,
      process.env.HASGRADT_TOKEN_ID!,
      this.arbitrationFee
    );

    // 3. Crear caso en el contrato inteligente
    const txId = await this.contractService.executeContractFunction(
      this.arbitrationContract,
      'initiateDispute',
      [credentialId, reason, evidence.map(e => e.ipfsHash), complainant]
    );

    return {
      caseId: this.generateCaseId(credentialId, complainant),
      credentialId,
      complainant,
      reason,
      evidence,
      status: 'open',
      timestamp: new Date(),
      transactionId: txId
    };
  }

  async resolveDispute(
    caseId: string,
    decision: DisputeDecision,
    arbitrator: string
  ): Promise<DisputeResolution> {
    // 1. Verificar que el árbitro está autorizado
    const isAuthorized = await this.contractService.queryContract(
      this.arbitrationContract,
      'isAuthorizedArbitrator',
      [arbitrator]
    );
    
    if (!isAuthorized) {
      throw new Error('Unauthorized arbitrator');
    }

    // 2. Ejecutar resolución en el contrato
    const txId = await this.contractService.executeContractFunction(
      this.arbitrationContract,
      'resolveDispute',
      [caseId, decision]
    );

    // 3. Aplicar acciones según decisión
    if (decision.revocation) {
      await this.hederaService.revokeCredential(caseId.split('-')[0]);
    }

    return {
      caseId,
      decision,
      arbitrator,
      timestamp: new Date(),
      transactionId: txId
    };
  }

  private async checkStanding(account: string, credentialId: string): Promise<boolean> {
    // Implementar lógica para verificar derecho a disputar
  }

  private generateCaseId(credentialId: string, complainant: string): string {
    return `${credentialId}-${complainant}-${Date.now()}`;
  }
}

interface DisputeReason {
  type: string;
  description: string;
}

interface DisputeEvidence {
  ipfsHash: string;
  description?: string;
}

interface DisputeCase {
  caseId: string;
  credentialId: string;
  complainant: string;
  reason: DisputeReason;
  evidence: DisputeEvidence[];
  status: 'open' | 'closed' | 'resolved';
  timestamp: Date;
  transactionId: string;
}

interface DisputeDecision {
  revocation: boolean;
  notes?: string;
}

interface DisputeResolution {
  caseId: string;
  decision: DisputeDecision;
  arbitrator: string;
  timestamp: Date;
  transactionId: string;
}
