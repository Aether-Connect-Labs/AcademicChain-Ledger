// src/lib/hedera/client.ts
import { Client, PrivateKey, AccountId, TokenCreateTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";

class HederaClient {
  private static instance: Client;
  private static accountId: string;
  private static privateKey: string;

  static initialize(accountId: string, privateKey: string, network: 'testnet' | 'mainnet' = 'testnet') {
    this.accountId = accountId;
    this.privateKey = privateKey;
    
    this.instance = network === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
      
    this.instance.setOperator(
      AccountId.fromString(accountId), 
      PrivateKey.fromString(privateKey)
    );
  }

  static getClient(): Client {
    if (!this.instance) {
      throw new Error("Hedera client not initialized. Call initialize() first.");
    }
    return this.instance;
  }

  static async createAcademicToken(tokenName: string, tokenSymbol: string) {
    const client = this.getClient();
    
    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(5000)
      .setTreasuryAccountId(AccountId.fromString(this.accountId))
      .freezeWith(client);

    const signTx = await transaction.sign(PrivateKey.fromString(this.privateKey));
    const submitTx = await signTx.execute(client);
    const receipt = await submitTx.getReceipt(client);
    
    return receipt.tokenId?.toString();
  }
}

export default HederaClient;