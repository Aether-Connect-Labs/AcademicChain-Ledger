// packages/infrastructure/src/blockchain/hedera.service.ts
import { Client, PrivateKey, AccountId, TokenCreateTransaction, TokenMintTransaction } from "@hashgraph/sdk";

export class HederaService {
  private client: Client;

  constructor() {
    this.client = process.env.HEDERA_NETWORK === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    this.client.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
    );
  }

  async createAcademicToken(tokenName: string): Promise<string> {
    const transaction = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol("ACAD")
      .setTokenType("NON_FUNGIBLE_UNIQUE")
      .setSupplyType("FINITE")
      .setMaxSupply(5000)
      .setTreasuryAccountId(this.client.operatorAccountId!)
      .freezeWith(this.client)
      .sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));

    const response = await transaction.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    return receipt.tokenId!.toString();
  }

  async mintNFT(tokenId: string, metadata: string): Promise<number> {
    const transaction = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(metadata)])
      .freezeWith(this.client)
      .sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));

    const response = await transaction.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    return receipt.serials[0].toNumber();
  }
}