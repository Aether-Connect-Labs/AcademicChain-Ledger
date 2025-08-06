import { injectable } from 'inversify';
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery } from "@hashgraph/sdk";
import { HederaService } from './hedera.service';

@injectable()
export class HederaConsensusService {
  private client: Client;
  private topicId: string | null = null;

  constructor(private hederaService: HederaService) {
    this.client = hederaService.getClient();
  }

  async initializeTopic(): Promise<string> {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo('AcademicChain Credential Events')
      .execute(this.client);
    
    const receipt = await tx.getReceipt(this.client);
    this.topicId = receipt.topicId!.toString();
    return this.topicId;
  }

  async submitMessage(message: object): Promise<string> {
    if (!this.topicId) {
      await this.initializeTopic();
    }

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId!)
      .setMessage(JSON.stringify(message))
      .execute(this.client);
    
    const receipt = await tx.getReceipt(this.client);
    return receipt.status.toString();
  }

  async subscribeToMessages(callback: (message: string) => void): Promise<void> {
    if (!this.topicId) {
      await this.initializeTopic();
    }

    new TopicMessageQuery()
      .setTopicId(this.topicId!)
      .subscribe(this.client, (message) => {
        callback(message.contents.toString());
      });
  }

  async logCredentialEvent(eventType: string, credentialId: string, metadata: any = {}): Promise<void> {
    const message = {
      eventType,
      credentialId,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    await this.submitMessage(message);
  }
}
