const BaseService = require('../blockchain/baseService');
const xrpl = require('xrpl');

class XRPLService extends BaseService {
  constructor() {
    super();
    this.client = null;
  }

  async connect() {
    this.client = new xrpl.Client(process.env.XRPL_NODE_URL);
    await this.client.connect();
  }

  async sendTransaction(tx) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await this.client.submit(tx);
    });
  }

  async getTransaction(txId) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await this.client.getTransaction(txId);
    });
  }
}

module.exports = XRPLService;