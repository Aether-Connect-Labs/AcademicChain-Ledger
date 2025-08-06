// packages/infrastructure/src/services/mentorship.service.ts
import { injectable } from 'inversify';
import { HederaService } from './hedera.service';
import { ContractService } from './contract.service';

interface MentorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface MentorshipSession {
  programId: string;
  mentor: string;
  mentee: string;
  startTime: number;
  duration: number;
  rate: number;
  status: string;
  transactionId: string;
}

interface MentorshipProgram {
  mentor: string;
  topic: string;
  rate: number;
}

@injectable()
export class MentorshipService {
  private readonly mentorshipContract: string;
  private readonly sessionPrice = 100; // 100 HASGRADT por hora

  constructor(
    private hederaService: HederaService,
    private contractService: ContractService
  ) {
    this.mentorshipContract = process.env.MENTORSHIP_CONTRACT_ADDRESS!;
  }

  async createMentorshipProgram(
    mentor: string,
    topic: string,
    rate: number,
    availability: MentorAvailability[]
  ): Promise<string> {
    const txId = await this.contractService.executeContractFunction(
      this.mentorshipContract,
      'createProgram',
      [mentor, topic, rate, availability]
    );

    return txId;
  }

  async bookSession(
    programId: string,
    mentee: string,
    startTime: number,
    duration: number
  ): Promise<MentorshipSession> {
    const program = await this.getProgram(programId);
    const totalCost = program.rate * duration;

    await this.hederaService.transferToken(
      mentee,
      this.mentorshipContract,
      process.env.HASGRADT_TOKEN_ID!,
      totalCost
    );

    const txId = await this.contractService.executeContractFunction(
      this.mentorshipContract,
      'bookSession',
      [programId, mentee, startTime, duration]
    );

    return {
      programId,
      mentor: program.mentor,
      mentee,
      startTime,
      duration,
      rate: program.rate,
      status: 'scheduled',
      transactionId: txId
    };
  }

  async completeSession(
    sessionId: string,
    mentor: string,
    rating: number,
    feedback: string
  ): Promise<string> {
    const session = await this.getSession(sessionId);
    if (session.mentor !== mentor) {
      throw new Error('Only the assigned mentor can complete the session');
    }

    const txId = await this.contractService.executeContractFunction(
      this.mentorshipContract,
      'completeSession',
      [sessionId, rating, feedback]
    );

    const totalAmount = session.duration * session.rate;
    const fee = this.calculateFee(totalAmount);
    const mentorAmount = totalAmount - fee;

    await this.hederaService.transferToken(
      this.mentorshipContract,
      mentor,
      process.env.HASGRADT_TOKEN_ID!,
      mentorAmount
    );

    return txId;
  }

  private calculateFee(amount: number): number {
    return amount * 0.1;
  }

  async getProgram(programId: string): Promise<MentorshipProgram> {
    return this.contractService.queryContract(
      this.mentorshipContract,
      'getProgram',
      [programId]
    );
  }

  async getSession(sessionId: string): Promise<MentorshipSession> {
    return this.contractService.queryContract(
      this.mentorshipContract,
      'getSession',
      [sessionId]
    );
  }
}
