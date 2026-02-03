const BaseService = require('../blockchain/baseService');
let algosdk = null;
try { algosdk = require('algosdk'); } catch (e) { algosdk = null; }
const { AlgorandAnchor } = require('../models');
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

class AlgorandService extends BaseService {
  constructor() {
    super();
    this.client = null;
    this.account = null;
    this.address = null;
    this.network = 'disabled';
    this.memAnchors = [];
  }
  async connect() {
    try {
      const enabledFlag = (
        String(process.env.ALGORAND_ENABLED).toLowerCase() === 'true' ||
        process.env.ALGORAND_ENABLE === '1' ||
        process.env.ENABLE_ALGORAND === '1'
      );
      if (!algosdk || !enabledFlag) { this.network = 'disabled'; return false; }
      const token = process.env.ALGORAND_TOKEN || '';
      const normalize = (s) => String(s || '').trim().replace(/^['"`]+|['"`]+$/g, '');
      let server = normalize(process.env.ALGORAND_SERVER || '');
      const net = (process.env.ALGORAND_NETWORK || 'testnet').toLowerCase();
      if (!server) {
        server = net === 'mainnet' ? 'https://mainnet-api.algonode.cloud' :
                 net === 'betanet' ? 'https://betanet-api.algonode.cloud' :
                 'https://testnet-api.algonode.cloud';
      }
      let port = normalize(process.env.ALGORAND_PORT || '');
      if (!port || port.toLowerCase() === 'value') port = '443';
      const headerName = process.env.ALGORAND_TOKEN_HEADER || '';
      const tokenParam = headerName ? { [headerName]: token } : token;
      this.client = new algosdk.Algodv2(tokenParam, server, port);
      const mnemonicRaw = await resolveSecretValue(process.env.ALGORAND_MNEMONIC, 'GCP_ALGORAND_MNEMONIC_SECRET');
      if (mnemonicRaw) {
        const words = String(mnemonicRaw)
          .trim()
          .split(/[\s,]+/)
          .map(w => w.replace(/^\d+\.*$/, '').replace(/^\d+\./, '').trim())
          .filter(Boolean);
        const normalizedMnemonic = words.join(' ');
        this.account = algosdk.mnemonicToSecretKey(normalizedMnemonic);
        this.address = this.account.addr;
      } else {
        this.address = process.env.ALGORAND_ADDRESS || '';
      }
      this.network = net || 'testnet';
      return true;
    } catch (e) {
      try { require('../utils/logger').error('Algorand connect error:', e.message); } catch {}
      this.client = null;
      this.account = null;
      this.address = null;
      this.network = 'disabled';
      return false;
    }
  }
  isEnabled() {
    return !!(algosdk && this.client && this.network !== 'disabled' && (this.account || this.address));
  }
  getAddress() {
    return this.address || null;
  }
  async getBalance() {
    if (!this.isEnabled() || !this.address) return { enabled: false, network: this.network || 'disabled' };
    const info = await this.client.accountInformation(this.address).do();
    return { enabled: true, network: this.network, address: this.address, balanceMicroAlgos: info.amount };
  }
  async sendTransaction(signedTxn) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await this.client.sendRawTransaction(signedTxn).do();
    });
  }
  async getTransaction(txId) {
    return this.retryOperation(async () => {
      if (!this.client) await this.connect();
      return await this.client.pendingTransactionInformation(txId).do();
    });
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
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    if (!this.isEnabled() || !this.account) {
      const isTest = (process.env.NODE_ENV || '') === 'test' || (process.env.NODE_ENV || '') === 'development';
      if (isTest || !AlgorandAnchor || typeof AlgorandAnchor.create !== 'function' || mongoDisabled) {
        const doc = { ...base, algoTxId: `mock-algo-${Date.now()}`, status: 'submitted' };
        this.memAnchors.push(doc);
        return doc;
      }
      const doc = await AlgorandAnchor.create(base);
      return doc;
    }
    const params = await this.client.getTransactionParams().do();
    const feeAlgos = parseFloat(process.env.ALGORAND_ANCHOR_FEE || '0.0001');
    const amount = Math.max(0, Math.round(feeAlgos * 1e6));
    const dest = process.env.ALGORAND_BACKUP_ADDRESS || this.address;
    const memoJson = JSON.stringify({
      certificateHash: base.certificateHash,
      hederaTokenId: base.hederaTokenId,
      serialNumber: base.serialNumber,
      timestamp: base.timestamp.toISOString(),
      title: data.title || null,
      issuer: data.issuer || null,
      cid: data.cid || null, // Filecoin/IPFS CID
      format: 'ACAD@1.0'
    });
    const note = new Uint8Array(Buffer.from(memoJson, 'utf8'));
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: this.address,
      to: dest,
      amount,
      note,
      suggestedParams: params
    });
    const signedTxn = txn.signTxn(this.account.sk);
    const resp = await this.client.sendRawTransaction(signedTxn).do();
    const txId = resp.txId;
    if (mongoDisabled || !AlgorandAnchor || typeof AlgorandAnchor.create !== 'function') {
      const doc = { ...base, algoTxId: txId, status: 'submitted' };
      this.memAnchors.push(doc);
      return doc;
    }
    const doc = await AlgorandAnchor.create({ ...base, algoTxId: txId, status: 'submitted' });
    return doc;
  }
  async getByHash(certificateHash) {
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    if (mongoDisabled) {
      const found = this.memAnchors.filter(a => a.certificateHash === certificateHash).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
      return found || null;
    }
    return AlgorandAnchor.findOne({ certificateHash }).sort({ createdAt: -1 });
  }
  async getByTokenSerial(tokenId, serialNumber) {
    const mongoDisabled = (process.env.DISABLE_MONGO === '1' || !isConnected());
    if (mongoDisabled) {
      const found = this.memAnchors.filter(a => a.hederaTokenId === tokenId && String(a.serialNumber) === String(serialNumber)).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
      return found || null;
    }
    return AlgorandAnchor.findOne({ hederaTokenId: tokenId, serialNumber }).sort({ createdAt: -1 });
  }
}

module.exports = new AlgorandService();
