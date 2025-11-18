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
  ContractExecuteTransaction,
  ContractFunctionParameters,
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

  async connect() {
    try {
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        logger.warn('⚠️  Missing Hedera credentials in environment variables. Hedera features will be disabled.');
        return false;
      }
      this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY.replace(/^0x/, ''));
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
    if (!metadata.uniqueHash) {
      throw new BadRequestError('uniqueHash is required');
    }
    const crypto = require('crypto');
    const subjectRef = crypto
      .createHash('sha256')
      .update(`${metadata.studentId || ''}|${metadata.degree || ''}|${metadata.university || ''}|${metadata.graduationDate || ''}`)
      .digest('hex');

    const standardizedMetadata = {
      name: `${metadata.degree} - ${metadata.university}`,
      description: `Credencial académica verificable emitida por ${metadata.university}.`,
      image: "ipfs://QmY9n55aG4f3g2h1j0kLmnOpQrStUvWxYzAbCdEfGhIjKl",
      type: "application/json",
      format: "HIP412@2.0.0",
      attributes: [
        { trait_type: "University", value: metadata.university },
        { trait_type: "Degree", value: metadata.degree },
        { trait_type: "Graduation Date", display_type: "date", value: new Date(metadata.graduationDate).toISOString() },
        { trait_type: "SubjectRef", value: subjectRef },
      ],
      properties: {
        issuedDate: new Date().toISOString(),
        schemaVersion: "1.0",
        additionalProofs: metadata.additionalInfo?.proofs || undefined
      }
    };
    let onChainMetadata;
    if (metadata.ipfsURI) {
      onChainMetadata = Buffer.from(metadata.ipfsURI, 'utf8');
    } else {
      const ipfsResult = await ipfsService.pinJson(standardizedMetadata, `Credential for ${metadata.studentName}`);
      const metadataCid = ipfsResult.IpfsHash;
      onChainMetadata = Buffer.from(`ipfs://${metadataCid}`, 'utf8');
    }
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

  async getAccountPublicKey(accountId) {
    if (!accountId) {
      throw new BadRequestError('Account ID is required');
    }
    const info = await new AccountInfoQuery().setAccountId(AccountId.fromString(accountId)).execute(this.client);
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
