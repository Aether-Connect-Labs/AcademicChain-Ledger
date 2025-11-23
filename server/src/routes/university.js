const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, isUniversity } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaServices');
const logger = require('../utils/logger');
const { Token, Transaction, Credential } = require('../models');
const { issuanceQueue, isRedisConnected } = require('../../queue/issuanceQueue');
const { recordAnalytics, getUniversityInsights } = require('../services/analyticsService');
const NodeCache = require('node-cache');

const balanceCache = new NodeCache({ stdTTL: 300 });

const router = express.Router();

router.get('/profile', protect, isUniversity, asyncHandler(async (req, res) => {
  const { user } = req;
  let balance = { hbars: '0', tokens: '{}' };
  const cacheKey = `balance_${user.hederaAccountId}`;

  if (user.hederaAccountId) {
    const cachedBalance = balanceCache.get(cacheKey);
    if (cachedBalance) {
      balance = cachedBalance;
    } else {
      try {
        balance = await hederaService.getAccountBalance(user.hederaAccountId);
        balanceCache.set(cacheKey, balance);
      } catch (error) {
        logger.warn(`Could not get balance for ${user.hederaAccountId}: ${error.message}`);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      university: {
        id: user.id,
        name: user.universityName,
        email: user.email,
        hederaAccountId: user.hederaAccountId,
        balance: balance.hbars,
        role: user.role
      }
    }
  });
}));

router.post('/create-token', protect, isUniversity, 
  [
    body('tokenName').notEmpty().withMessage('Token name is required').trim().escape(),
    body('tokenSymbol').notEmpty().withMessage('Token symbol is required').trim().escape(),
    body('tokenMemo').optional().isString().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenName, tokenSymbol, tokenMemo } = req.body;
    const { user } = req;

    const existingToken = await Token.findOne({ tokenSymbol, universityId: user.id });
    if (existingToken) {
      return res.status(409).json({ success: false, message: `Token symbol '${tokenSymbol}' already exists for your university.` });
    }

    const result = await hederaService.createAcademicToken({
      tokenName: `${user.universityName} - ${tokenName}`,
      tokenSymbol,
      tokenMemo: tokenMemo || `Academic credential from ${user.universityName}`,
      treasuryAccountId: user.hederaAccountId || null,
    });

    const dbToken = await Token.create({
      tokenId: result.tokenId,
      tokenName,
      tokenSymbol,
      universityId: user.id,
    });

    logger.info(`🎓 Academic token created by ${user.universityName}: ${result.tokenId}`);
    res.status(201).json({
      success: true,
      message: 'Academic token created successfully',
      data: result,
    });
  })
);

router.post('/prepare-issuance', protect, isUniversity, 
  [
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('uniqueHash').notEmpty().withMessage('uniqueHash is required').trim().escape(),
    body('ipfsURI').notEmpty().withMessage('ipfsURI is required').trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { user } = req;
    const { tokenId, ...credentialData } = req.body;
    const MINT_FEE = 100000000;
    const PAYMENT_TOKEN_ID = process.env.PAYMENT_TOKEN_ID;

    const token = await Token.findOne({ tokenId, universityId: user.id });
    if (!token) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this token.' });
    }

    const transactionRecord = await Transaction.create({
      universityId: user.id,
      type: 'CREDENTIAL_ISSUANCE',
      status: 'PENDING_PAYMENT',
      credentialData: req.body,
    });

    let transactionBytes = null;
    if (PAYMENT_TOKEN_ID && user.hederaAccountId && MINT_FEE > 0) {
      transactionBytes = await hederaService.prepareServiceChargeTransaction(
        user.hederaAccountId,
        process.env.HEDERA_ACCOUNT_ID,
        MINT_FEE,
        PAYMENT_TOKEN_ID
      );
    } else {
      transactionRecord.status = 'PENDING_ISSUANCE';
      await transactionRecord.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Issuance prepared. Please sign the payment transaction if required.',
      data: {
        transactionId: transactionRecord.id,
        paymentTransactionBytes: transactionBytes,
      }
    });
  })
);

router.post('/execute-issuance', protect, isUniversity, 
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('signedPaymentTransactionBytes').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { transactionId, signedPaymentTransactionBytes } = req.body;
    const { user } = req;
    const { Credential } = require('../models');

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.universityId !== user.id) {
      return res.status(404).json({ success: false, message: 'Transaction not found or you are not authorized.' });
    }

    if (transaction.status !== 'PENDING_PAYMENT' && transaction.status !== 'PENDING_ISSUANCE') {
        return res.status(409).json({ success: false, message: `Transaction is already in progress or completed with status: ${transaction.status}` });
    }

    try {
      const { credentialData } = transaction;

      // 1. On-chain validation via Smart Contract
      await hederaService.requestCredentialOnChain(
        credentialData.uniqueHash,
        credentialData.ipfsURI,
        credentialData.recipientAccountId || '0.0.0' // Use a placeholder if no student account
      );

      // 2. Process payment if required
      if (signedPaymentTransactionBytes) {
        if (transaction.status !== 'PENDING_PAYMENT') {
            return res.status(409).json({ success: false, message: 'Payment has already been processed or is not required.' });
        }
        const paymentResult = await hederaService.executeSignedTransaction(signedPaymentTransactionBytes);
        if (paymentResult.receipt.status.toString() !== 'SUCCESS') {
          transaction.status = 'PAYMENT_FAILED';
          transaction.errorDetails = { message: `Payment receipt status: ${paymentResult.receipt.status.toString()}` };
          await transaction.save();
          return res.status(402).json({ success: false, message: 'Payment failed. Credential not issued.', data: paymentResult });
        }
        transaction.paymentTransactionId = paymentResult.transactionId;
        transaction.status = 'PENDING_ISSUANCE';
        await transaction.save();
        logger.info(`💰 Payment successful for DB transaction ${transaction.id}. TxID: ${paymentResult.transactionId}`);
      }

      // 3. Mint the NFT on HTS
      const mintResult = await hederaService.mintAcademicCredential(credentialData.tokenId, {
        ...credentialData,
        university: user.universityName,
      });

      transaction.issuanceTransactionId = mintResult.transactionId;
      transaction.status = 'ISSUANCE_COMPLETE';
      await transaction.save();

      // 4. Save credential record to local DB
      await Credential.create({
        tokenId: credentialData.tokenId,
        serialNumber: mintResult.serialNumber,
        universityId: user.id,
        studentAccountId: credentialData.recipientAccountId || null,
        uniqueHash: credentialData.uniqueHash,
        ipfsURI: credentialData.ipfsURI,
      });

      // 5. Transfer to student if applicable
      let transferResult = null;
      if (credentialData.recipientAccountId) {
        transferResult = await hederaService.transferCredentialToStudent(
          credentialData.tokenId,
          mintResult.serialNumber,
          credentialData.recipientAccountId
        );
      }

      await recordAnalytics('CREDENTIAL_MINTED', {
        universityId: user.id,
        universityName: user.universityName,
        tokenId: credentialData.tokenId,
        serialNumber: mintResult.serialNumber,
        degree: credentialData.degree,
      });

      logger.info(`🎓 Credential issued for DB transaction ${transaction.id}. NFT TxID: ${mintResult.transactionId}`);

      res.status(201).json({
        success: true,
        message: 'Credential validated on-chain and issued successfully.',
        data: {
          mint: mintResult,
          transfer: transferResult,
        }
      });
    } catch (error) {
        logger.error(`Error during issuance for transaction ${transaction.id}:`, error);
        transaction.status = transaction.status === 'PENDING_ISSUANCE' ? 'ISSUANCE_FAILED' : 'PAYMENT_FAILED';
        transaction.errorDetails = { message: error.message, stack: error.stack };
        await transaction.save();
        
        if (error.message.includes('Duplicate credential')) {
          return res.status(409).json({ success: false, message: error.message });
        }
        
        res.status(500).json({ success: false, message: 'An unexpected error occurred during issuance.' });
    }
  })
);

// Encolar emisión masiva
router.post('/issue-bulk', protect, isUniversity,
  [
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required'),
    body('roomId').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, credentials, roomId } = req.body;
    const { user } = req;
    if (isRedisConnected()) {
      const job = await issuanceQueue.add('bulk-issuance', {
        tokenId,
        credentials,
        universityName: user.universityName,
        roomId: roomId || user.id,
      });
      res.status(202).json({ success: true, message: 'Bulk issuance enqueued', data: { jobId: job.id } });
    } else {
      // Fallback: Process credentials directly if Redis is not connected
      logger.warn('Redis not connected. Processing bulk issuance directly.');
      const results = [];
      for (const credentialData of credentials) {
        try {
          const mintResult = await hederaService.mintAcademicCredential(tokenId, {
            ...credentialData,
            university: user.universityName,
          });

          let transferResult = null;
          if (credentialData.recipientAccountId) {
            transferResult = await hederaService.transferCredentialToStudent(
              tokenId,
              mintResult.serialNumber,
              credentialData.recipientAccountId
            );
          }

          await Credential.create({
            tokenId: tokenId,
            serialNumber: mintResult.serialNumber,
            universityId: user.id,
            studentAccountId: credentialData.recipientAccountId || null,
            uniqueHash: credentialData.uniqueHash,
            ipfsURI: credentialData.ipfsURI,
          });

          await recordAnalytics('CREDENTIAL_MINTED', {
            universityId: user.id,
            universityName: user.universityName,
            tokenId: tokenId,
            serialNumber: mintResult.serialNumber,
            degree: credentialData.degree,
          });

          results.push({ success: true, credential: credentialData, mint: mintResult, transfer: transferResult });
        } catch (error) {
          logger.error(`Error processing direct issuance for credential ${credentialData.uniqueHash}:`, error);
          results.push({ success: false, credential: credentialData, error: error.message });
        }
      }
      res.status(200).json({ success: true, message: 'Bulk issuance processed directly (Redis not connected)', data: results });
    }
  })
);

router.post('/revoke-credential', protect, isUniversity, 
  [
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('serialNumber').isNumeric().withMessage('Serial number is required'),
    body('reason').notEmpty().withMessage('A reason for revocation is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, serialNumber, reason } = req.body;
    const { user } = req;

    const token = await Token.findOne({ tokenId, universityId: user.id });
    if (!token) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this token.' });
    }

    const burnResult = await hederaService.burnCredential(tokenId, serialNumber);

    logger.info(`🔥 Credential revoked by ${user.universityName}: ${tokenId}#${serialNumber}. Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Credential revoked successfully',
      data: burnResult,
    });
  })
);

router.get('/tokens', protect, isUniversity, asyncHandler(async (req, res) => {
  const { user } = req;

  const tokens = await Token.find({ universityId: user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      tokens,
      university: user.universityName
    }
  });
}));

router.get('/token/:tokenId', protect, isUniversity, 
  [param('tokenId').notEmpty().withMessage('Token ID is required').trim().escape()],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const tokenInfo = await hederaService.getTokenInfo(tokenId);
    res.status(200).json({ success: true, data: tokenInfo });
  })
);

router.post('/batch-issue', protect, isUniversity, 
  [
    body('tokenId').notEmpty().withMessage('Token ID is required'),
    body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, credentials } = req.body;
    const { user } = req;

    const job = await issuanceQueue.add('batch-issuance', {
      tokenId,
      credentials,
      universityName: user.universityName,
      universityId: user.id,
    });

    logger.info(`Batch issuance job ${job.id} queued for ${user.universityName}`);

    res.status(202).json({
      success: true,
      message: 'Batch issuance job has been queued successfully.',
      data: {
        jobId: job.id,
      }
    });
  })
);

router.get('/batch-status/:jobId', protect, isUniversity, asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await issuanceQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  const state = await job.getState();
  const progress = job.progress;
  const returnValue = job.returnvalue;

  res.status(200).json({
    success: true,
    data: {
      jobId,
      state,
      progress,
      result: returnValue,
    }
  });
}));

router.get('/statistics', protect, isUniversity, asyncHandler(async (req, res) => {
  const { user } = req;

  const statistics = await getUniversityInsights(user.id);

  res.status(200).json({
    success: true,
    data: {
      university: user.universityName,
      statistics
    }
  });
}));

module.exports = router;