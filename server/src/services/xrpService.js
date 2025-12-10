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
      const enabledFlag = (
        process.env.ENABLE_XRP_PAYMENTS === '1' ||
        process.env.XRPL_ENABLE === '1' ||
        String(process.env.XRPL_ENABLED).toLowerCase() === 'true'
      );
      if (!xrpl || !enabledFlag) { this.network = 'disabled'; return false; }
      this.seed = process.env.XRPL_SEED || process.env.XRPL_SECRET;
      this.address = process.env.XRPL_ADDRESS || '';
      const net = process.env.XRPL_NETWORK || 'testnet';
      const url = net === 'mainnet' ? 'wss://xrplcluster.com' : 'wss://s.altnet.rippletest.net:51233';
      this.client = new xrpl.Client(url);
      await require('../utils/timeoutConfig').TimeoutManager.promiseWithTimeout(this.client.connect(), 'xrpl');
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
  getAddress() {
    if (!this.seed || !xrpl) return null;
    try {
      const wallet = xrpl.Wallet.fromSeed(this.seed);
      return wallet.address;
    } catch { return null; }
  }
  async getBalance() {
    if (!this.isEnabled()) return { enabled: false, network: this.network || 'disabled' };
    const wallet = xrpl.Wallet.fromSeed(this.seed);
    const balance = await require('../utils/timeoutConfig').TimeoutManager.promiseWithTimeout(this.client.getXrpBalance(wallet.address), 'xrpl');
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
    const prepared = await require('../utils/timeoutConfig').TimeoutManager.promiseWithTimeout(this.client.autofill(tx), 'xrpl');
    const signed = wallet.sign(prepared);
    const submit = await require('../utils/timeoutConfig').TimeoutManager.promiseWithTimeout(this.client.submitAndWait(signed.tx_blob), 'xrpl');
    const hash = submit.result.hash;
    const doc = await XrpAnchor.create({ ...base, xrpTxHash: hash, status: 'submitted' });
    return doc;
  }
  async sendPayment({ destination, amountDrops, memo }) {
    if (!this.isEnabled()) throw new Error('XRPL not enabled');
    if (!destination || !amountDrops) throw new Error('destination and amountDrops are required');
    const wallet = xrpl.Wallet.fromSeed(this.seed);
    const tx = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: destination,
      Amount: String(amountDrops),
    };
    if (memo) {
      const memoDataHex = Buffer.from(memo, 'utf8').toString('hex').toUpperCase();
      tx.Memos = [{ Memo: { MemoData: memoDataHex } }];
    }
    const t0 = Date.now();
    const prepared = await this.client.autofill(tx);
    const signed = wallet.sign(prepared);
    const submit = await this.client.submitAndWait(signed.tx_blob);
    try { const dt = (Date.now() - t0) / 1000; require('./cacheService').set('metrics:operation_duration_seconds:xrpl_payment', Number(dt.toFixed(6)), 180); } catch {}
    return { hash: submit.result.hash, result: submit.result };
  }
  async verifyPayment({ txHash, destination, minDrops, memoContains }) {
    if (!this.client) throw new Error('XRPL client not connected');
    if (!txHash) throw new Error('txHash is required');
    const resp = await require('../utils/timeoutConfig').TimeoutManager.promiseWithTimeout(this.client.request({ command: 'tx', transaction: txHash }), 'xrpl');
    const tx = resp.result;
    const meta = tx.meta || {};
    const okType = tx.TransactionType === 'Payment';
    const okRes = (meta.TransactionResult || tx.meta?.TransactionResult) === 'tesSUCCESS';
    const okDest = !destination || tx.Destination === destination;
    const amt = parseInt(tx.Amount, 10);
    const okAmt = !minDrops || Number.isFinite(amt) && amt >= minDrops;
    let okMemo = true;
    if (memoContains) {
      const memos = Array.isArray(tx.Memos) ? tx.Memos : [];
      okMemo = memos.some(m => {
        const hex = m?.Memo?.MemoData || '';
        let str = '';
        try { str = Buffer.from(hex, 'hex').toString('utf8'); } catch { str = ''; }
        return str.includes(memoContains);
      });
    }
    const verified = okType && okRes && okDest && okAmt && okMemo;
    return {
      verified,
      from: tx.Account,
      to: tx.Destination,
      amountDrops: amt,
      memos: tx.Memos || [],
      meta,
    };
  }
  async getByHash(certificateHash) {
    return XrpAnchor.findOne({ certificateHash }).sort({ createdAt: -1 });
  }
  async getByTokenSerial(tokenId, serialNumber) {
    return XrpAnchor.findOne({ hederaTokenId: tokenId, serialNumber }).sort({ createdAt: -1 });
  }
}

module.exports = new XrpService();
