import { injectable, inject } from 'inversify';
import { HederaService } from './hedera.service';

@injectable()
export class PaymentService {
  private readonly commissionRate = 0.05; // 5% de comisión

  constructor(
    @inject('HederaService') private hederaService: HederaService
  ) {}

  async processPayment(
    senderAccount: string,
    amount: number,
    memo: string = ''
  ): Promise<string> {
    // Calcular comisión
    const commission = amount * this.commissionRate;
    const netAmount = amount - commission;

    // Transferir al destinatario principal
    const mainTxId = await this.hederaService.transferHbar(
      senderAccount,
      process.env.ACADEMICCHAIN_MAIN_ACCOUNT!,
      netAmount,
      memo
    );

    // Transferir comisión a la cuenta de tesorería
    await this.hederaService.transferHbar(
      senderAccount,
      process.env.ACADEMICCHAIN_TREASURY_ACCOUNT!,
      commission,
      'Commission payment'
    );

    return mainTxId;
  }

  async processTokenPayment(
    senderAccount: string,
    tokenId: string,
    amount: number
  ): Promise<string> {
    return this.hederaService.transferToken(
      senderAccount,
      process.env.ACADEMICCHAIN_MAIN_ACCOUNT!,
      tokenId,
      amount
    );
  }
}