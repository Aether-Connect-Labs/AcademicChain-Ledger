import { injectable } from 'inversify';
import { HederaService } from './hedera.service';
import { ContractService } from './contract.service';
import { AuditService } from './audit.service';

@injectable()
export class StakingService {
  private readonly stakingContractAddress: string;
  private readonly rewardRate = 0.1; // 10% APY
  private readonly lockPeriod = 30 * 24 * 60 * 60 * 1000; // 30 días

  constructor(
    private hederaService: HederaService,
    private contractService: ContractService,
    private auditService: AuditService
  ) {
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS!;
  }

  async stakeTokens(userId: string, amount: number): Promise<string> {
    // 1. Transferir tokens al contrato de staking
    const transferTx = await this.hederaService.transferToken(
      userId,
      this.stakingContractAddress,
      process.env.HASGRADT_TOKEN_ID!,
      amount
    );

    // 2. Registrar stake en el contrato
    const contractTx = await this.contractService.executeContractFunction(
      this.stakingContractAddress,
      'stake',
      [userId, amount, Date.now() + this.lockPeriod]
    );

    // 3. Registrar evento
    await this.auditService.logAction({
      userId,
      action: 'STAKE_TOKENS',
      amount,
      metadata: { transferTx, contractTx }
    });

    return contractTx;
  }

  async calculateRewards(userId: string): Promise<number> {
    const stakeInfo = await this.contractService.queryContract(
      this.stakingContractAddress,
      'getStakeInfo',
      [userId]
    );

    if (!stakeInfo || stakeInfo.amount === 0) return 0;

    const stakedTime = Date.now() - stakeInfo.timestamp;
    const stakedDays = stakedTime / (1000 * 60 * 60 * 24);
    const annualReward = stakeInfo.amount * this.rewardRate;
    const proportionalReward = (annualReward * stakedDays) / 365;

    return proportionalReward;
  }

  async claimRewards(userId: string): Promise<string> {
    const rewards = await this.calculateRewards(userId);
    if (rewards <= 0) throw new Error('No rewards to claim');

    // Verificar período de bloqueo
    const stakeInfo = await this.contractService.queryContract(
      this.stakingContractAddress,
      'getStakeInfo',
      [userId]
    );

    if (Date.now() < stakeInfo.lockEnd) {
      throw new Error('Stake period not ended');
    }

    // Ejecutar claim en el contrato
    const tx = await this.contractService.executeContractFunction(
      this.stakingContractAddress,
      'claimRewards',
      [userId]
    );

    // Registrar evento
    await this.auditService.logAction({
      userId,
      action: 'CLAIM_REWARDS',
      amount: rewards,
      metadata: { transactionId: tx }
    });

    return tx;
  }

  async getStakingStats(userId: string): Promise<{
    stakedAmount: number;
    rewards: number;
    lockEnd: number;
    apy: number;
  }> {
    const stakeInfo = await this.contractService.queryContract(
      this.stakingContractAddress,
      'getStakeInfo',
      [userId]
    );

    const rewards = await this.calculateRewards(userId);

    return {
      stakedAmount: stakeInfo?.amount || 0,
      rewards,
      lockEnd: stakeInfo?.lockEnd || 0,
      apy: this.rewardRate * 100
    };
  }
}
