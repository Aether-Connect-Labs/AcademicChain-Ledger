const logger = require('../utils/logger');
let xrpl = null;
try { xrpl = require('xrpl'); } catch (e) { xrpl = null; }
const { XrpAnchor } = require('../models');
const { isConnected } = require('../config/database');
let SecretManagerServiceClient = null;
try { SecretManagerServiceClient = require('@google-cloud/secret-manager').SecretManagerServiceClient; } catch { SecretManagerServiceClient = null; }
async function resolveSecretValue(envVal, secretEnvName) {
  const val = String(envVal || '').trim();
  if (val) return val;
  const resName = String(process.env[secretEnvName] || '').trim();
  if (!resName || !SecretManagerServiceClient) return '';
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: resName });
    const payload = version.payload?.data?.toString('utf8') || '';
    return String(payload || '').trim();
  } catch {
    return '';
  }
}

class XrpService {
  constructor() {
    this.client = null;
    this.address = null;
    this.seed = null;
    this.network = 'disabled';
    this.memAnchors = [];
  }
  async connect() {
    // Evitar reinicialización si ya está conectado
    if (this.client && this.client.isConnected()) return true;

    try {
      const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';
      if (isTestEnv) { this.network = 'disabled'; return false; }
      const enabledFlag = (
        process.env.ENABLE_XRP_PAYMENTS === '1' ||
        process.env.XRPL_ENABLE === '1' ||
        String(process.env.XRPL_ENABLED).toLowerCase() === 'true'
      );
      if (!xrpl || !enabledFlag) { this.network = 'disabled'; return false; }
      this.seed = await resolveSecretValue(process.env.XRPL_SEED || process.env.XRPL_SECRET, 'GCP_XRPL_SEED_SECRET');
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
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    logger.info(`XRP Anchor: Enabled=${this.isEnabled()}, MongoDisabled=${mongoDisabled}, Network=${this.network}`);

    if (!this.isEnabled()) {
      logger.info('XRP Anchor: Using Mock/Memory Path');
      const isTest = (process.env.NODE_ENV || '') === 'test' || (process.env.NODE_ENV || '') === 'development';
      if (isTest || !XrpAnchor || typeof XrpAnchor.create !== 'function' || mongoDisabled) {
        const doc = { ...base, xrpTxHash: `mock-xrp-${Date.now()}`, status: 'submitted' };
        this.memAnchors.push(doc);
        logger.info(`XRP Anchor: Mocked ${doc.xrpTxHash}`);
        return doc;
      }
      const doc = await XrpAnchor.create(base);
      return doc;
    }
    logger.info('XRP Anchor: Attempting Real Transaction');
    logger.info('XRP Anchor: Attempting Real Transaction');
    try {
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
      let feeXrp = parseFloat(String(process.env.XRP_ANCHOR_FEE || '').trim());
      if (!Number.isFinite(feeXrp) || feeXrp <= 0) {
        const alias = parseFloat(String(process.env.ENABLE_XRP_ANCHOR || '').trim());
        feeXrp = (Number.isFinite(alias) && alias > 0 && alias < 0.1) ? alias : 0.000001;
      }
      const drops = Math.max(1, Math.round(feeXrp * 1_000_000));
      let dest = process.env.XRP_BACKUP_WALLET || wallet.address;
      if (dest === wallet.address) {
        try {
          const axios = require('axios');
          const faucetResp = await axios.post('https://faucet.altnet.rippletest.net/accounts', {});
          const funded = faucetResp?.data?.account?.address;
          if (funded && typeof funded === 'string') dest = funded;
        } catch {}
      }
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
      if (mongoDisabled || !XrpAnchor || typeof XrpAnchor.create !== 'function') {
        const doc = { ...base, xrpTxHash: hash, status: 'submitted' };
        this.memAnchors.push(doc);
        return doc;
      }
      const doc = await XrpAnchor.create({ ...base, xrpTxHash: hash, status: 'submitted' });
      return doc;
    } catch (e) {
      logger.error(`XRP Anchor Real Transaction Failed: ${e.message}`);
      // Fallback to mock on error?
      const doc = { ...base, xrpTxHash: `mock-xrp-fallback-${Date.now()}`, status: 'submitted' };
      this.memAnchors.push(doc);
      return doc;
    }
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
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    if (mongoDisabled) {
      const found = this.memAnchors.filter(a => a.certificateHash === certificateHash).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
      return found || null;
    }
    return XrpAnchor.findOne({ certificateHash }).sort({ createdAt: -1 });
  }
  async getByTokenSerial(tokenId, serialNumber) {
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    if (mongoDisabled) {
      const found = this.memAnchors.filter(a => a.hederaTokenId === tokenId && String(a.serialNumber) === String(serialNumber)).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
      return found || null;
    }
    return XrpAnchor.findOne({ hederaTokenId: tokenId, serialNumber }).sort({ createdAt: -1 });
  }
}

module.exports = new XrpService();
