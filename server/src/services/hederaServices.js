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
  TokenInfoQuery,
  TokenNftInfoQuery,
  TransferTransaction,
  Transaction,
  NftId,
} = require('@hashgraph/sdk');

const { logger } = require('../utils/logger');
const { HederaError, BadRequestError, NotFoundError } = require('../utils/errors');
const ipfsService = require('./ipfsService');
const axios = require('axios');

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
  }

  connect() {
    try {
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        throw new HederaError('Missing Hedera credentials in environment variables');
      }
      this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY.replace(/^0x/, ''));
      const network = process.env.HEDERA_NETWORK || 'testnet';
      this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      logger.info(`✅ Hedera client initialized for ${network}`);
    } catch (error) {
      logger.error('❌ Failed to initialize Hedera client:', error);
      throw new HederaError('Failed to initialize Hedera client');
    }
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

  async createAcademicToken(tokenData) {
    if (!tokenData || !tokenData.tokenName || !tokenData.tokenSymbol) {
      throw new BadRequestError('tokenName and tokenSymbol are required');
    }
    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenData.tokenName)
      .setTokenSymbol(tokenData.tokenSymbol)
      .setTokenMemo(tokenData.tokenMemo || 'Academic credential NFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(this.operatorId)
      .setAdminKey(this.operatorKey.publicKey)
      .setSupplyKey(this.operatorKey.publicKey)
      .setFreezeDefault(false);
    const { receipt } = await this._executeTransaction(transaction);
    const tokenId = receipt.tokenId;
    logger.info(`✅ Academic token created: ${tokenId}`);
    return {
      tokenId: tokenId.toString(),
      transactionId: receipt.transactionId.toString(),
    };
  }

  async mintAcademicCredential(tokenId, metadata) {
    if (!tokenId || !metadata) {
      throw new BadRequestError('tokenId and metadata are required');
    }
    const standardizedMetadata = {
      name: `${metadata.degree} - ${metadata.studentName}`,
      description: `Credencial académica oficial emitida por ${metadata.university}. Verificable en AetherConnect.`,
      image: "https://gateway.pinata.cloud/ipfs/QmY9n55aG4f3g2h1j0kLmnOpQrStUvWxYzAbCdEfGhIjKl",
      type: "application/json",
      format: "HIP412@2.0.0",
      attributes: [
        { trait_type: "University", value: metadata.university },
        { trait_type: "Degree", value: metadata.degree },
        { trait_type: "Student", value: metadata.studentName },
        { trait_type: "Graduation Date", display_type: "date", value: new Date(metadata.graduationDate).toISOString() },
        { trait_type: "GPA", value: metadata.gpa.toString() },
      ],
      properties: {
        studentId: metadata.studentId,
        issuedDate: new Date().toISOString(),
        ...metadata.additionalInfo
      }
    };
    const ipfsResult = await ipfsService.pinJson(standardizedMetadata, `Credential for ${metadata.studentName}`);
    const metadataCid = ipfsResult.IpfsHash;
    const onChainMetadata = Buffer.from(`ipfs://${metadataCid}`, 'utf8');
    const transaction = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([onChainMetadata]);
    const { receipt } = await this._executeTransaction(transaction);
    const serialNumber = receipt.serials[0].toString();
    logger.info(`✅ Credential minted with serial: ${serialNumber}`);
    return {
      serialNumber,
      transactionId: receipt.transactionId.toString(),
    };
  }

  async transferCredentialToStudent(tokenId, serialNumber, recipientAccountId) {
    if (!tokenId || !serialNumber || !recipientAccountId) {
      throw new BadRequestError('tokenId, serialNumber, and recipientAccountId are required');
    }
    const transferTransaction = new TokenTransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenId),
        parseInt(serialNumber, 10),
        this.operatorId,
        AccountId.fromString(recipientAccountId)
      );
    const { receipt } = await this._executeTransaction(transferTransaction);
    logger.info(`✅ Credential transferred successfully`);
    return { transactionId: receipt.transactionId.toString() };
  }

  async burnCredential(tokenId, serialNumber) {
    if (!tokenId || !serialNumber) {
      throw new BadRequestError('tokenId and serialNumber are required for burning');
    }
    const transaction = new TokenBurnTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setSerials([parseInt(serialNumber, 10)]);
    const { receipt } = await this._executeTransaction(transaction);
    logger.info(`🔥 Credential burned: ${tokenId}#${serialNumber}. New total supply: ${receipt.totalSupply}`);
    return {
      transactionId: receipt.transactionId.toString(),
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
    const signedTransactionBytes = Buffer.from(signedTransactionBytesBase64, 'base64');
    const signedTransaction = Transaction.fromBytes(signedTransactionBytes);
    const response = await signedTransaction.execute(this.client);
    const receipt = await response.getReceipt(this.client);
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
    try {
      const query = new TokenNftInfoQuery().setNftId(new NftId(TokenId.fromString(tokenId), parseInt(serialNumber, 10)));
      const nftInfo = await query.execute(this.client);
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
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (axios.isAxiosError(error)) {
        logger.error('❌ Failed to fetch metadata from IPFS:', error.message);
        throw new Error('Could not retrieve credential metadata from IPFS.');
      }
      logger.error('❌ Failed to verify credential:', error.message);
      throw new HederaError('Failed to verify credential');
    }
  }

  async getAccountBalance(accountId) {
    if (!accountId) {
      throw new BadRequestError('Account ID is required');
    }
    const query = new AccountBalanceQuery().setAccountId(accountId);
    const accountBalance = await query.execute(this.client);
    return {
      hbars: accountBalance.hbars.toString(),
      tokens: accountBalance.tokens.toString(),
    };
  }

  async getTokenInfo(tokenId) {
    if (!tokenId) {
      throw new BadRequestError('Token ID is required');
    }
    const query = new TokenInfoQuery().setTokenId(tokenId);
    const tokenInfo = await query.execute(this.client);
    return {
      tokenId: tokenInfo.tokenId.toString(),
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      totalSupply: tokenInfo.totalSupply.toString(),
      treasuryAccountId: tokenInfo.treasuryAccountId.toString(),
    };
  }
}

module.exports = new HederaService();
