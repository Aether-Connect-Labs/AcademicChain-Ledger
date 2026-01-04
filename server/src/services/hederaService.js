const BaseService = require('../blockchain/baseService');
const { Client, PrivateKey } = require('@hashgraph/sdk');

class HederaService extends BaseService {
  constructor() {
    super();
    this.client = null;
  }

  async connect() {
    this.client = Client.forTestnet();
    this.client.setOperator(
      process.env.HEDERA_OPERATOR_ID,
      PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
    );
  }

  async sendTransaction(transaction) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await transaction.execute(this.client);
    });
  }

  async getTransaction(txId) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await this.client.getTransactionReceipt(txId);
    });
  }
}

module.exports = HederaService;