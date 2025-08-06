import { injectable, inject } from 'inversify';

@injectable()
export class RewardService {
  private readonly rewardRules = {
    PROFILE_COMPLETION: 50,
    FIRST_CREDENTIAL: 100,
    SOCIAL_SHARE: 30,
    MONTHLY_ACTIVE: 200,
    REFERRAL: 150
  };

  constructor(
    @inject('BlockchainService') private blockchainService: any, // Placeholder for BlockchainService
    @inject('UserRepository') private userRepo: any // Placeholder for UserRepository
  ) {}

  async grantReward(userId: string, actionType: keyof typeof this.rewardRules): Promise<void> {
    const amount = this.rewardRules[actionType];
    const user = await this.userRepo.findById(userId);
    
    if (!user) throw new Error('User not found');
    
    // Transferir tokens
    const txId = await this.blockchainService.transferToken(
      process.env.REWARDS_ACCOUNT!,
      user.walletAddress,
      process.env.HASGRADT_TOKEN_ID!,
      amount
    );
    
    // Registrar en el historial
    user.rewardHistory.push({
      action: actionType,
      amount,
      date: new Date(),
      txId
    });
    
    await this.userRepo.save(user);
  }

  async calculateUserLevel(userId: string): Promise<number> {
    const user = await this.userRepo.findById(userId);
    if (!user) return 0;
    
    const totalPoints = user.rewardHistory.reduce((sum: number, reward: any) => sum + reward.amount, 0);
    return Math.floor(totalPoints / 1000); // 1000 puntos por nivel
  }
}