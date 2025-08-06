// packages/infrastructure/src/services/audit.service.ts
import { injectable } from 'inversify';
import { BlockchainAuditor, DatabaseAuditor } from './auditors';

@injectable()
export class AuditService {
  private auditors = [
    new BlockchainAuditor(),
    new DatabaseAuditor(),
    new SystemEventsAuditor()
  ];

  constructor() {
    this.setupRealTimeMonitoring();
  }

  async logAction(action: AuditAction): Promise<void> {
    // Almacenar en base de datos
    await AuditModel.create(action);
    
    // Registrar en blockchain para inmutabilidad
    const txHash = await this.recordOnChain(action);
    
    // Replicar en otros sistemas de auditoría
    await Promise.all(
      this.auditors.map(auditor => 
        auditor.record(action).catch(e => 
          console.error(`Auditor ${auditor.constructor.name} failed:`, e)
        )
      )
    );
  }

  private async recordOnChain(action: AuditAction): Promise<string> {
    const client = new HederaClient();
    const metadata = JSON.stringify(action);
    return client.mintNFT(
      process.env.AUDIT_TOKEN_ID!,
      metadata
    );
  }

  private setupRealTimeMonitoring() {
    process.on('uncaughtException', (error) => {
      this.logAction({
        type: 'SYSTEM_ERROR',
        severity: 'CRITICAL',
        message: `Uncaught exception: ${error.message}`,
        timestamp: new Date(),
        metadata: { stack: error.stack }
      });
    });
  }
}

interface AuditAction {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: Date;
  userId?: string;
  institutionId?: string;
  credentialId?: string;
  metadata?: any;
}
