const logger = require('../utils/logger');
let algosdk = null;
try { algosdk = require('algosdk'); } catch (e) { algosdk = null; }
const { AlgorandAnchor } = require('../models');

class AlgorandService {
  constructor() {
    this.client = null;
    this.account = null;
    this.network = 'disabled';
  }
  async connect() {
    try {
      const enabledFlag = (
        process.env.ALGORAND_ENABLED === 'true' ||
        process.env.ALGORAND_ENABLE === '1' ||
        process.env.ENABLE_ALGORAND === '1'
      );
      if (!algosdk || !enabledFlag) { this.network = 'disabled'; return false; }
      const token = process.env.ALGOD_TOKEN || '';
      const net = process.env.ALGORAND_NETWORK || 'testnet';
      const url = process.env.ALGOD_URL || (net === 'mainnet' ? 'https://mainnet-api.algonode.cloud' : 'https://testnet-api.algonode.cloud');
      const port = Number(process.env.ALGOD_PORT || 443);
      this.client = new algosdk.Algodv2(token, url, port);
      const sk64 = process.env.ALGORAND_SK64 || '';
      const mn = process.env.ALGORAND_MNEMONIC || '';
      let acct = null;
      if (mn) {
        acct = algosdk.mnemonicToSecretKey(mn);
      } else if (sk64) {
        const sk = Uint8Array.from(Buffer.from(sk64, 'base64'));
        const addr = algosdk.encodeAddress(algosdk.generateAccount().addr.publicKey || algosdk.generateAccount().addr);
        acct = { addr, sk };
      }
      this.account = acct || null;
      this.network = net;
      logger.info(`Algorand client initialized for ${net}`);
      return true;
    } catch (e) {
      logger.warn('Algorand initialization failed');
      this.client = null;
      this.network = 'disabled';
      return false;
    }
  }
  isEnabled() {
    return !!(algosdk && this.client && this.account && this.network !== 'disabled');
  }
  async getBalance() {
    if (!this.isEnabled()) return { enabled: false, network: this.network || 'disabled' };
    const accInfo = await this.client.accountInformation(this.account.addr).do();
    return { enabled: true, network: this.network, address: this.account.addr, balanceMicroAlgos: accInfo.amount };
  }
  async anchor(data) {
    const now = new Date();
    const base = {
      certificateHash: data.certificateHash,
      hederaTokenId: data.hederaTokenId || null,
      serialNumber: data.serialNumber || null,
      timestamp: data.timestamp ? new Date(data.timestamp) : now,
      network: this.network,
      status: 'mock',
    };
    if (!this.isEnabled()) {
      const isTest = (process.env.NODE_ENV || '') === 'test';
      if (isTest || !AlgorandAnchor || typeof AlgorandAnchor.create !== 'function') {
        return { ...base, algoTxId: null };
      }
      const doc = await AlgorandAnchor.create(base);
      return doc;
    }
    const params = await this.client.getTransactionParams().do();
    const noteObj = {
      certificateHash: base.certificateHash,
      hederaTokenId: base.hederaTokenId,
      serialNumber: base.serialNumber,
      timestamp: base.timestamp.toISOString(),
      format: 'ACAD@1.0'
    };
    const note = Buffer.from(JSON.stringify(noteObj), 'utf8');
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: this.account.addr,
      to: this.account.addr,
      amount: 0,
      note,
      suggestedParams: params,
    });
    const signed = txn.signTxn(this.account.sk);
    const send = await this.client.sendRawTransaction(signed).do();
    const txId = send.txId || send.txid || null;
    const doc = await AlgorandAnchor.create({ ...base, algoTxId: txId, status: 'submitted' });
    return doc;
  }
}

module.exports = new AlgorandService();
