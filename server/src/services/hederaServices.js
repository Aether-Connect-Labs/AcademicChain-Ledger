const {
  Client,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TokenTransferTransaction,
  AccountId,
  PrivateKey,
  TokenType,
  TokenSupplyType,
  TokenId,
  AccountBalanceQuery,
  AccountInfoQuery,
  TokenInfoQuery,
  TokenNftInfoQuery,
  TransferTransaction,
  Transaction,
  NftId,
  PublicKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
} = require('@hashgraph/sdk');

const logger = require('../utils/logger');
const { TimeoutManager } = require('../utils/timeoutConfig');
const { createError } = require('../utils/errorCodes');
const { HederaError, BadRequestError, NotFoundError } = require('../utils/errors');
const ipfsService = require('./ipfsService');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
  }

  async connect() {
    // Evitar reinicialización si ya está conectado
    if (this.client) return true;

    try {
      const acct = String(process.env.HEDERA_ACCOUNT_ID || '').trim();
      const priv = await resolveSecretValue(process.env.HEDERA_PRIVATE_KEY, 'GCP_HEDERA_PRIVATE_KEY_SECRET');
      if (!acct || !priv) {
        logger.warn('⚠️  Missing Hedera credentials. Hedera features will be disabled.');
        return false;
      }
      this.operatorId = AccountId.fromString(acct);
      const pkEnv = String(priv || '').trim();
      const hex = pkEnv.replace(/^0x/, '');
      const looksHex = /^[0-9a-fA-F]+$/.test(hex) && hex.length >= 64;
      let parsedKey = null;
      if (looksHex) {
        try {
          parsedKey = PrivateKey.fromStringECDSA(hex);
        } catch (e2) {
          parsedKey = PrivateKey.fromStringRaw(hex);
        }
      } else {
        parsedKey = PrivateKey.fromString(pkEnv);
      }
      this.operatorKey = parsedKey;
      const network = process.env.HEDERA_NETWORK || 'testnet';
      this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      logger.info(`✅ Hedera client initialized for ${network}`);
      return true;
    } catch (error) {
      logger.warn('⚠️  Failed to initialize Hedera client:', error.message);
      return false;
    }
  }

  isEnabled() {
    return !!(this.client && this.operatorId && this.operatorKey);
  }

  async _executeTransaction(transaction) {
    try {
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      return { response, receipt };
    } catch (error) {
      logger.error('❌ Hedera transaction failed:', error);
      throw new HederaError('Hedera transaction failed');
    }
  }

  async requestCredentialOnChain(uniqueHash, ipfsURI, studentAccountId) {
    const contractId = process.env.ACADEMIC_LEDGER_CONTRACT_ID;
    if (!contractId) {
      throw new HederaError('ACADEMIC_LEDGER_CONTRACT_ID is not configured in environment variables.');
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100000) // Adjust gas as needed
      .setFunction("mintCredential", new ContractFunctionParameters()
        .addAddress(studentAccountId)
        .addBytes32(Buffer.from(uniqueHash, 'hex'))
        .addString(ipfsURI)
      );

    try {
      const { receipt } = await this._executeTransaction(transaction);
      if (receipt.status.toString() !== 'SUCCESS') {
        throw new HederaError(`On-chain request failed with status: ${receipt.status.toString()}`);
      }
      logger.info(`✅ On-chain credential request successful for hash: ${uniqueHash}`);
      return {
        success: true,
        transactionId: receipt.transactionId.toString(),
      };
    } catch (error) {
      if (error.message.includes('Duplicate credential')) {
        throw new BadRequestError('Duplicate credential: This hash has already been registered on-chain.');
      }
      logger.error(`❌ On-chain credential request failed for hash ${uniqueHash}:`, error);
      throw error; // Re-throw other Hedera errors
    }
  }

  async createAcademicToken(tokenData) {
    if (!tokenData || !tokenData.tokenName || !tokenData.tokenSymbol) {
      throw new BadRequestError('tokenName and tokenSymbol are required');
    }
    if (!this.isEnabled()) {
      const tokenId = `0.0.${Math.floor(100000 + Math.random()*900000)}`;
      return { tokenId, transactionId: `mock-${uuidv4()}` };
    }
    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenData.tokenName)
      .setTokenSymbol(tokenData.tokenSymbol)
      .setTokenMemo(tokenData.tokenMemo || 'Academic credential NFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(tokenData.treasuryAccountId ? AccountId.fromString(tokenData.treasuryAccountId) : this.operatorId)
      .setAdminKey(this.operatorKey.publicKey)
      .setSupplyKey(this.operatorKey.publicKey)
      .setFreezeDefault(false);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(transaction), 'hedera');
    const tokenId = receipt.tokenId;
    logger.info(`✅ Academic token created: ${tokenId}`);
    return {
      tokenId: tokenId.toString(),
      transactionId: response.transactionId.toString(),
    };
  }

  async createPaymentToken(tokenData) {
    if (!tokenData || !tokenData.tokenName || !tokenData.tokenSymbol) {
      throw new BadRequestError('tokenName and tokenSymbol are required');
    }
    if (!this.isEnabled()) {
      const tokenId = `0.0.${Math.floor(100000 + Math.random()*900000)}`;
      return { tokenId, transactionId: `mock-${uuidv4()}` };
    }
    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenData.tokenName)
      .setTokenSymbol(tokenData.tokenSymbol)
      .setTokenMemo(tokenData.tokenMemo || 'Payment token (Fungible)')
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setDecimals(typeof tokenData.decimals === 'number' ? tokenData.decimals : 6)
      .setInitialSupply(typeof tokenData.initialSupply === 'number' ? tokenData.initialSupply : 0)
      .setTreasuryAccountId(tokenData.treasuryAccountId ? AccountId.fromString(tokenData.treasuryAccountId) : this.operatorId)
      .setAdminKey(this.operatorKey.publicKey)
      .setSupplyKey(this.operatorKey.publicKey)
      .setFreezeDefault(false);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(transaction), 'hedera');
    const tokenId = receipt.tokenId;
    logger.info(`✅ Payment token created: ${tokenId}`);
    return {
      tokenId: tokenId.toString(),
      transactionId: response.transactionId.toString(),
    };
  }

  async mintAcademicCredential(tokenId, metadata) {
    if (!tokenId || !metadata) {
      throw new BadRequestError('tokenId and metadata are required');
    }
    if (!metadata.uniqueHash) {
      throw new BadRequestError('uniqueHash is required');
    }
    if (!this.isEnabled()) {
      const serialNumber = String(Math.floor(1 + Math.random()*100000));
      return { serialNumber, transactionId: `mock-${uuidv4()}` };
    }
    const crypto = require('crypto');
    const subjectRef = crypto
      .createHash('sha256')
      .update(`${metadata.studentId || ''}|${metadata.degree || ''}|${metadata.university || ''}|${metadata.graduationDate || ''}`)
      .digest('hex');

      const displayName = metadata.studentName ? `${metadata.degree} - ${metadata.studentName} - ${metadata.university}` : `${metadata.degree} - ${metadata.university}`;
    const standardizedMetadata = {
      name: displayName,
      description: `Credencial académica verificable emitida por ${metadata.university}.`,
      image: metadata.image || undefined,
      type: "application/json",
      format: "HIP412@2.0.0",
        attributes: [
          { trait_type: "University", value: metadata.university },
          { trait_type: "Student", value: metadata.studentName || '' },
          { trait_type: "Degree", value: metadata.degree },
          { trait_type: "Graduation Date", display_type: "date", value: (() => { const d = new Date(metadata.graduationDate || Date.now()); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); })() },
          { trait_type: "SubjectRef", value: subjectRef },
          { trait_type: "Institución", value: metadata.university },
          { trait_type: "Estudiante", value: metadata.studentName || '' },
          { trait_type: "Título", value: metadata.degree },
        ],
      properties: {
        issuedDate: new Date().toISOString(),
        schemaVersion: "1.0",
        title: displayName,
        issuer: metadata.university,
        issuerAccountId: process.env.HEDERA_ACCOUNT_ID || null,
        vc_ready: "true",
        vc_schema: "https://schema.org/EducationalOccupationalCredential",
        creator: metadata.creator || undefined,
        credential_type: "Credential",
        additionalProofs: metadata.additionalInfo?.proofs || undefined,
        externalProofs: {
            xrp: metadata.xrpTxHash || undefined,
            algorand: metadata.algoTxId || undefined
        },
        external_anchors: {
          xrpl: metadata.xrpTxHash ? {
            testnet_tx_hash: metadata.xrpTxHash,
            explorer_url: `${(String(process.env.XRPL_NETWORK || 'testnet').includes('live') ? 'https://livenet.xrpl.org/transactions/' : 'https://testnet.xrpl.org/transactions/')}${metadata.xrpTxHash}`
          } : undefined,
          algorand: metadata.algoTxId ? {
            testnet_tx_id: metadata.algoTxId,
            explorer_url: `https://testnet.explorer.perawallet.app/tx/${metadata.algoTxId}/`
          } : undefined
        },
        credential_info: {
          issue_date: new Date().toISOString(),
          expiry_date: metadata.expiryDate || undefined
        },
        file: {
          uri: metadata.ipfsURI || undefined,
          hash: metadata.uniqueHash || undefined
        },
        certificate: {
          institution: metadata.university,
          studentName: metadata.studentName || '',
          degree: metadata.degree || '',
          issuedDate: new Date().toISOString(),
          externalProofs: {
            xrpTxHash: metadata.xrpTxHash || null,
            algoTxId: metadata.algoTxId || null
          }
        }
      }
    };
    if (metadata.xrpTxHash) {
        standardizedMetadata.attributes.push({ trait_type: "XRP Anchor", value: metadata.xrpTxHash });
    }
    if (metadata.algoTxId) {
        standardizedMetadata.attributes.push({ trait_type: "Algorand Anchor", value: metadata.algoTxId });
    }
    if (metadata.type) {
      standardizedMetadata.attributes.unshift({ trait_type: "Credential Type", value: metadata.type });
    }
    let onChainMetadata;
    const ipfsMeta = { cid: null, uri: null, gateway: null, filecoin: null };
    try {
      const crypto = require('crypto');
      const pdfCid = metadata.ipfsURI ? String(metadata.ipfsURI).replace('ipfs://','').trim() : '';
      const sName = String(metadata.studentName || '').toUpperCase();
      const sDegree = String(metadata.degree || '').toUpperCase();
      const uniId = String(metadata.universityId || metadata.university || '').trim();
      const baseStr = [sName, sDegree, uniId, String(metadata.graduationDate || ''), String(metadata.dni || ''), String(pdfCid || String(metadata.uniqueHash || ''))].join('|');
      const integrityHash = crypto.createHash('sha256').update(baseStr, 'utf8').digest('hex');
      standardizedMetadata.properties.file = {
        uri: metadata.ipfsURI || undefined,
        hash: integrityHash
      };
    } catch {
      standardizedMetadata.properties.file = {
        uri: metadata.ipfsURI || undefined,
        hash: metadata.uniqueHash || subjectRef
      };
    }
    if (metadata.ipfsURI) {
      onChainMetadata = Buffer.from(metadata.ipfsURI, 'utf8');
      try {
        const cid = String(metadata.ipfsURI).replace('ipfs://', '').trim();
        ipfsMeta.cid = cid;
        ipfsMeta.uri = metadata.ipfsURI;
        ipfsMeta.gateway = `https://gateway.pinata.cloud/ipfs/${cid}`;
      } catch {}
    } else {
      let metadataCid;
      try {
        const ipfsResult = await ipfsService.pinJson(standardizedMetadata, `Credential for ${metadata.studentName}`);
        metadataCid = ipfsResult.IpfsHash;
        ipfsMeta.cid = metadataCid;
        ipfsMeta.uri = `ipfs://${metadataCid}`;
        ipfsMeta.gateway = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;
        if (ipfsResult.filecoin) {
          ipfsMeta.filecoin = ipfsResult.filecoin;
        }
      } catch (e) {
        logger.warn('Failed to upload metadata to IPFS, using fallback URI:', e.message);
        metadataCid = "QmDemoPlaceholderNoIpfsConfigured";
      }
      onChainMetadata = Buffer.from(`ipfs://${metadataCid}`, 'utf8');
    }
    const transaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([onChainMetadata]);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(transaction), 'hedera');
    const serialNumber = receipt.serials[0].toString();
    logger.info(`✅ Credential minted with serial: ${serialNumber}`);
    const txId = receipt?.transactionId ? receipt.transactionId.toString() : (response?.transactionId ? response.transactionId.toString() : `unknown-${Date.now()}`);
    return {
      serialNumber,
      transactionId: txId,
      ipfs: ipfsMeta.cid ? { cid: ipfsMeta.cid, uri: ipfsMeta.uri, gateway: ipfsMeta.gateway } : undefined,
      filecoin: ipfsMeta.filecoin || undefined,
    };
  }

  async transferCredentialToStudent(tokenId, serialNumber, recipientAccountId) {
    if (!tokenId || !serialNumber || !recipientAccountId) {
      throw new BadRequestError('tokenId, serialNumber, and recipientAccountId are required');
    }
    if (!this.isEnabled()) {
      return { transactionId: `mock-${uuidv4()}` };
    }
    const transferTransaction = new TokenTransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenId),
        parseInt(serialNumber, 10),
        this.operatorId,
        AccountId.fromString(recipientAccountId)
      );
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(transferTransaction), 'hedera');
    logger.info(`✅ Credential transferred successfully`);
    return { transactionId: response.transactionId.toString() };
  }

  async ensureMerkleTopic() {
    const topicIdEnv = String(process.env.HEDERA_MERKLE_TOPIC_ID || '').trim();
    if (topicIdEnv) return topicIdEnv;
    if (!this.isEnabled()) throw new HederaError('Hedera not enabled');
    const tx = new TopicCreateTransaction().setTopicMemo('AcademicChain Merkle Root Ledger');
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(tx), 'hedera');
    const topicId = receipt.topicId?.toString() || (response?.receipt?.topicId?.toString() || '');
    return topicId;
  }

  async submitMerkleRoot(root, meta = {}) {
    if (!root || typeof root !== 'string') throw new BadRequestError('merkleRoot is required');
    if (!this.isEnabled()) {
      return { topicId: 'mock-topic', sequence: 1, transactionId: `mock-${uuidv4()}` };
    }
    const topicId = await this.ensureMerkleTopic();
    const message = JSON.stringify({
      type: 'MERKLE_ROOT',
      merkleRoot: root,
      count: Number(meta.count || 0),
      batchId: meta.batchId || null,
      issuer: meta.issuer || 'AcademicChain',
      createdAt: new Date().toISOString(),
    });
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(tx), 'hedera');
    const txId = receipt?.transactionId ? receipt.transactionId.toString() : (response?.transactionId ? response.transactionId.toString() : `unknown-${Date.now()}`);
    const sequence = receipt?.topicSequenceNumber || response?.receipt?.topicSequenceNumber || 0;
    return { topicId, sequence, transactionId: txId };
  }

  async submitRevocation(tokenId, serialNumber, reason) {
    if (!tokenId || !serialNumber) throw new BadRequestError('tokenId and serialNumber are required');
    if (!this.isEnabled()) {
      return { topicId: 'mock-topic', sequence: 1, transactionId: `mock-${uuidv4()}` };
    }
    const topicId = await this.ensureMerkleTopic();
    const message = JSON.stringify({
      type: 'REVOKE',
      tokenId,
      serialNumber,
      status: 'REVOKED',
      reason: reason || null,
      timestamp: new Date().toISOString(),
      issuer: process.env.HEDERA_ACCOUNT_ID || null,
    });
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(tx), 'hedera');
    const txId = receipt?.transactionId ? receipt.transactionId.toString() : (response?.transactionId ? response.transactionId.toString() : `unknown-${Date.now()}`);
    const sequence = receipt?.topicSequenceNumber || response?.receipt?.topicSequenceNumber || 0;
    return { topicId, sequence, transactionId: txId };
  }

  async burnCredential(tokenId, serialNumber) {
    if (!tokenId || !serialNumber) {
      throw new BadRequestError('tokenId and serialNumber are required for burning');
    }
    const transaction = new TokenBurnTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setSerials([parseInt(serialNumber, 10)]);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(transaction), 'hedera');
    logger.info(`🔥 Credential burned: ${tokenId}#${serialNumber}. New total supply: ${receipt.totalSupply}`);
    return {
      transactionId: response.transactionId.toString(),
      newTotalSupply: receipt.totalSupply.toString(),
    };
  }

  async chargeForService(payerAccountIdString, amount, customTokenIdString) {
    logger.warn('DEPRECATED: `chargeForService` is replaced by the client-side signing flow.');
    throw new Error('`chargeForService` is deprecated. Use `prepareServiceChargeTransaction` and `executeSignedTransaction` instead.');
  }

  async prepareServiceChargeTransaction(payerAccountId, recipientAccountId, amount, tokenId) {
    if (!payerAccountId || !recipientAccountId || !amount || !tokenId) {
      throw new BadRequestError('Payer, recipient, amount, and token ID are required for service charge');
    }
    const transaction = new TokenTransferTransaction()
      .addTokenTransfer(tokenId, payerAccountId, -amount)
      .addTokenTransfer(tokenId, recipientAccountId, amount)
      .freezeWith(this.client);
    const transactionBytes = transaction.toBytes();
    logger.info(`Prepared service charge transaction for ${amount} of token ${tokenId} from ${payerAccountId} to ${recipientAccountId}`);
    return Buffer.from(transactionBytes).toString('base64');
  }

  async executeSignedTransaction(signedTransactionBytesBase64) {
    if (!signedTransactionBytesBase64) {
      throw new BadRequestError('Signed transaction bytes are required.');
    }
    if (!this.isEnabled()) {
      return { receipt: { status: { toString: () => 'SUCCESS' } }, transactionId: `mock-${uuidv4()}` };
    }
    const signedTransactionBytes = Buffer.from(signedTransactionBytesBase64, 'base64');
    const signedTransaction = Transaction.fromBytes(signedTransactionBytes);
    const response = await TimeoutManager.promiseWithTimeout(signedTransaction.execute(this.client), 'hedera');
    const receipt = await TimeoutManager.promiseWithTimeout(response.getReceipt(this.client), 'hedera');
    logger.info(`✅ Executed signed transaction successfully. Status: ${receipt.status.toString()}`);
    return {
      receipt,
      transactionId: response.transactionId.toString(),
    };
  }

  async verifyCredential(tokenId, serialNumber) {
    if (!tokenId || !serialNumber) {
      throw new BadRequestError('tokenId and serialNumber are required');
    }
    if (!this.isEnabled()) {
      return {
        valid: true,
        onChain: false,
        credential: { 
            tokenId, 
            serialNumber, 
            ownerAccountId: '0.0.mock', 
            metadata: { 
                name: 'Mock Credential',
                description: 'Mock credential for testing',
                attributes: []
            } 
        }
      };
    }
    try {
      const query = new TokenNftInfoQuery().setNftId(new NftId(TokenId.fromString(tokenId), parseInt(serialNumber, 10)));
      const nftInfo = await TimeoutManager.promiseWithTimeout(query.execute(this.client), 'hedera');
      if (!nftInfo) {
        throw new NotFoundError('Credential not found');
      }
      const onChainMetadata = Buffer.from(nftInfo.metadata).toString('utf8');
      if (!onChainMetadata.startsWith('ipfs://')) {
        try {
          const metadata = JSON.parse(onChainMetadata);
          return {
            valid: true,
            onChain: true,
            credential: { tokenId, serialNumber, ownerAccountId: nftInfo.accountId.toString(), metadata }
          };
        } catch (e) {
          throw new HederaError('Invalid on-chain metadata format.');
        }
      }
      const cid = onChainMetadata.replace('ipfs://', '');
      try {
        const ipfsGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const response = await axios.get(ipfsGatewayUrl);
        const offChainMetadata = response.data;
        return {
          valid: true,
          onChain: false,
          credential: {
            tokenId,
            serialNumber,
            ownerAccountId: nftInfo.accountId.toString(),
            metadata: offChainMetadata,
            metadataCid: cid,
          },
        };
      } catch (e) {
        return {
          valid: true,
          onChain: false,
          credential: {
            tokenId,
            serialNumber,
            ownerAccountId: nftInfo.accountId.toString(),
            metadata: { uri: onChainMetadata },
            metadataCid: cid,
          },
        };
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (axios.isAxiosError(error)) {
        logger.error('❌ Failed to fetch metadata from IPFS:', error.message);
        return { valid: true, onChain: false, credential: { tokenId, serialNumber, ownerAccountId: null, metadata: { uri: `ipfs://unavailable` } } };
      }
      logger.error('❌ Failed to verify credential:', error.message);
      return { valid: false, credential: { tokenId, serialNumber, ownerAccountId: null } };
    }
  }

  async getAccountBalance(accountId) {
    if (!accountId) {
      throw new BadRequestError('Account ID is required');
    }
    const query = new AccountBalanceQuery().setAccountId(accountId);
    const accountBalance = await TimeoutManager.promiseWithTimeout(query.execute(this.client), 'hedera');
    return {
      hbars: accountBalance.hbars.toString(),
      tokens: accountBalance.tokens.toString(),
    };
  }

  async getAccountPublicKey(accountId) {
    if (!accountId) {
      throw new BadRequestError('Account ID is required');
    }
    const info = await TimeoutManager.promiseWithTimeout(new AccountInfoQuery().setAccountId(AccountId.fromString(accountId)).execute(this.client), 'hedera');
    return info.key.toString();
  }

  async verifySignature(accountId, message, signatureBase64) {
    if (!accountId || !message || !signatureBase64) {
      throw new BadRequestError('accountId, message, and signature are required');
    }
    const pubKeyStr = await this.getAccountPublicKey(accountId);
    const pubKey = PublicKey.fromString(pubKeyStr);
    const msgBytes = Buffer.from(message, 'utf8');
    const sigBytes = Buffer.from(signatureBase64, 'base64');
    return pubKey.verify(msgBytes, sigBytes);
  }

  async getTokenInfo(tokenId) {
    if (!tokenId) {
      throw new BadRequestError('Token ID is required');
    }
    const query = new TokenInfoQuery().setTokenId(tokenId);
    const tokenInfo = await TimeoutManager.promiseWithTimeout(query.execute(this.client), 'hedera');
    return {
      tokenId: tokenInfo.tokenId.toString(),
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      totalSupply: tokenInfo.totalSupply.toString(),
      treasuryAccountId: tokenInfo.treasuryAccountId.toString(),
    };
  }

  async createGradesTopic(memo) {
    if (!this.isEnabled()) {
      const topicId = `0.0.${Math.floor(100000 + Math.random()*900000)}`;
      return { topicId, transactionId: `mock-${uuidv4()}` };
    }
    const tx = new TopicCreateTransaction();
    if (memo) tx.setMemo(String(memo).slice(0, 100));
    const { response, receipt } = await this._executeTransaction(tx);
    return { topicId: receipt.topicId.toString(), transactionId: response.transactionId.toString() };
  }

  async publishGrade(topicId, payload) {
    if (!topicId || !payload) throw new BadRequestError('topicId and payload are required');
    const message = Buffer.from(JSON.stringify(payload), 'utf8');
    if (!this.isEnabled()) {
      return { sequenceNumber: Math.floor(1 + Math.random()*100000), consensusTimestamp: new Date().toISOString(), transactionId: `mock-${uuidv4()}` };
    }
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);
    const response = await TimeoutManager.promiseWithTimeout(tx.execute(this.client), 'hedera');
    const receipt = await TimeoutManager.promiseWithTimeout(response.getReceipt(this.client), 'hedera');
    return {
      sequenceNumber: receipt.topicSequenceNumber.toNumber ? receipt.topicSequenceNumber.toNumber() : Number(receipt.topicSequenceNumber || 0),
      consensusTimestamp: receipt.consensusTimestamp ? receipt.consensusTimestamp.toDate().toISOString() : new Date().toISOString(),
      transactionId: response.transactionId.toString(),
    };
  }

  async sendHbar(toAccountId, tinybars) {
    if (!toAccountId || typeof tinybars !== 'number') throw new BadRequestError('toAccountId and tinybars are required');
    if (!this.isEnabled()) {
      return { receipt: { status: { toString: () => 'SUCCESS' } }, transactionId: `mock-${uuidv4()}` };
    }
    const t0 = Date.now();
    const tx = new TransferTransaction()
      .addHbarTransfer(this.operatorId, -tinybars)
      .addHbarTransfer(AccountId.fromString(toAccountId), tinybars);
    const { response, receipt } = await TimeoutManager.promiseWithTimeout(this._executeTransaction(tx), 'hedera');
    try { const dt = (Date.now() - t0) / 1000; require('./cacheService').set('metrics:operation_duration_seconds:hedera_transfer', Number(dt.toFixed(6)), 180); } catch {}
    return { receipt, transactionId: response.transactionId.toString() };
  }
}

module.exports = new HederaService();
