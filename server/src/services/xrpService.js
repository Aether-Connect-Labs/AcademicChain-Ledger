const logger = require('../utils/logger');
let xrpl = null;
try { xrpl = require('xrpl'); } catch (e) { xrpl = null; }
const { XrpAnchor } = require('../models');

class XrpService {
  constructor() {
    this.client = null;
    this.address = null;
    this.seed = null;
    this.network = 'disabled';
  }
  async connect() {
    try {
      const enabledFlag = process.env.XRPL_ENABLE === '1' || String(process.env.XRPL_ENABLED).toLowerCase() === 'true';
      if (!xrpl || !enabledFlag) { this.network = 'disabled'; return false; }
      this.seed = process.env.XRPL_SEED || process.env.XRPL_SECRET;
      this.address = process.env.XRPL_ADDRESS || '';
      const net = process.env.XRPL_NETWORK || 'testnet';
      const url = net === 'mainnet' ? 'wss://xrplcluster.com' : 'wss://s.altnet.rippletest.net:51233';
      this.client = new xrpl.Client(url);
      await this.client.connect();
      this.network = net;
      logger.info(`XRPL client initialized for ${net}`);
      return true;
    } catch (e) {
      logger.warn('XRPL initialization failed');
      this.client = null;
      this.network = 'disabled';
      return false;
    }
  }
  isEnabled() {
    return !!(xrpl && this.client && this.network !== 'disabled' && this.seed);
  }
  async getBalance() {
    if (!this.isEnabled()) return { enabled: false, network: this.network || 'disabled' };
    const wallet = xrpl.Wallet.fromSeed(this.seed);
    const balance = await this.client.getXrpBalance(wallet.address);
    return { enabled: true, network: this.network, address: wallet.address, balance };
  }
  async anchor(data) {
    const now = new Date();
    const base = {
      certificateHash: data.certificateHash,
      hederaTokenId: data.hederaTokenId || null,
      serialNumber: data.serialNumber || null,
      hederaTopicId: data.hederaTopicId || null,
      hederaSequence: data.hederaSequence || null,
      timestamp: data.timestamp ? new Date(data.timestamp) : now,
      network: this.network,
      status: 'mock',
    };
    if (!this.isEnabled()) {
      const isTest = (process.env.NODE_ENV || '') === 'test';
      if (isTest || !XrpAnchor || typeof XrpAnchor.create !== 'function') {
        return { ...base, xrpTxHash: null };
      }
      const doc = await XrpAnchor.create(base);
      return doc;
    }
    const wallet = xrpl.Wallet.fromSeed(this.seed);
    const memoJson = JSON.stringify({
      certificateHash: base.certificateHash,
      hederaTokenId: base.hederaTokenId,
      serialNumber: base.serialNumber,
      hederaTopicId: base.hederaTopicId,
      hederaSequence: base.hederaSequence,
      timestamp: base.timestamp.toISOString(),
      title: data.title || null,
      issuer: data.issuer || null,
      format: 'ACAD@1.0'
    });
    const memoDataHex = Buffer.from(memoJson, 'utf8').toString('hex').toUpperCase();
    const memoTypeHex = Buffer.from('ACAD', 'utf8').toString('hex').toUpperCase();
    const memoFormatHex = Buffer.from('application/json', 'utf8').toString('hex').toUpperCase();
    const feeXrp = parseFloat(process.env.XRP_ANCHOR_FEE || '0.000001');
    const drops = Math.max(1, Math.round(feeXrp * 1_000_000));
    const dest = process.env.XRP_BACKUP_WALLET || wallet.address;
    const tx = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: dest,
      Amount: String(drops),
      Memos: [{ Memo: { MemoType: memoTypeHex, MemoFormat: memoFormatHex, MemoData: memoDataHex } }],
    };
    const prepared = await this.client.autofill(tx);
    const signed = wallet.sign(prepared);
    const submit = await this.client.submitAndWait(signed.tx_blob);
    const hash = submit.result.hash;
    const doc = await XrpAnchor.create({ ...base, xrpTxHash: hash, status: 'submitted' });
    return doc;
  }
  async getByHash(certificateHash) {
    return XrpAnchor.findOne({ certificateHash }).sort({ createdAt: -1 });
  }
  async getByTokenSerial(tokenId, serialNumber) {
    return XrpAnchor.findOne({ hederaTokenId: tokenId, serialNumber }).sort({ createdAt: -1 });
  }
}

module.exports = new XrpService();
