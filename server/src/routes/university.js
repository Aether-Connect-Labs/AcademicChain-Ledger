const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { protect, isUniversity } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const veramoSecure = require('../services/veramoSecure');
const logger = require('../utils/logger');
const { Token, Transaction, Credential, User } = require('../models');
const { isConnected: isMongoConnected } = require('../config/database');
const memoryStore = require('../utils/memoryStore');
const { issuanceQueue, isRedisConnected } = require('../../queue/issuanceQueue');
const { recordAnalytics, getUniversityInsights } = require('../services/analyticsService');
const NodeCache = require('node-cache');
const associationGuard = require('../middleware/associationGuard');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ipfsService = require('../services/ipfsService');

const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)){
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit to avoid memory saturation
});

const balanceCache = new NodeCache({ stdTTL: 300 });
const useMem = () => {
  const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  if (isTest) return false;
  return (process.env.DISABLE_MONGO === '1' || !isMongoConnected());
};
// Local fallback store (Migrated to utils/memoryStore)
// const memStore = { tokens: [], credentials: [] }; 
const memStore = memoryStore;

// Lazy load AuditLog and EncryptionService
const AuditLog = require('../models/AuditLog');
const encryptionService = require('../services/encryptionService');


const router = express.Router();

/**
 * @route POST /api/university/upload-secure
 * @desc Encrypts and uploads a credential file to IPFS
 * @access Private (University only)
 */
router.post('/upload-secure', protect, isUniversity, upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { user } = req;
    
    // Legal Check
    if (!user.legalTermsAccepted) {
        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(403).json({ success: false, message: 'Must accept legal terms (DPA) before uploading credentials.' });
    }

    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        
        // 1. Generate Encryption Key
        const fileKey = encryptionService.generateKey();
        
        // 2. Encrypt Content
        const encryptedBuffer = encryptionService.encryptBuffer(fileBuffer, fileKey);
        
        // 3. Upload to IPFS
        const storageResult = await ipfsService.pinFile(
            encryptedBuffer, 
            `encrypted-${req.file.originalname}`, 
            req.file.mimetype
        );

        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch {}

        res.status(200).json({
            success: true,
            data: {
                ipfsURI: `ipfs://${storageResult.IpfsHash}`,
                encryption: {
                    isEncrypted: true,
                    key: fileKey,
                    algo: 'aes-256-gcm'
                }
            }
        });
    } catch (error) {
        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch {}
        logger.error(`Secure upload failed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Secure upload failed.' });
    }
}));

function getAllowedNetworks(planRaw) {
  const plan = String(planRaw || 'basic').toLowerCase();
  if (plan === 'enterprise') return ['hedera', 'xrp', 'algorand'];
  if (plan === 'standard') return ['hedera', 'xrp'];
  return ['hedera'];
}

router.get('/acl/association-status', protect, isUniversity, asyncHandler(async (req, res) => {
  const tokenId = process.env.ACL_TOKEN_ID || '';
  const accountId = req.user?.hederaAccountId || '';
  if (!tokenId || !accountId) {
    return res.status(200).json({ success: true, data: { associated: false, tokenId, accountId } });
  }
  try {
    await hederaService.connect();
  } catch {}
  let associated = false;
  try {
    if (hederaService.isEnabled()) {
      associated = await hederaService.hasTokenAssociation(accountId, tokenId);
    }
  } catch {}
  res.status(200).json({ success: true, data: { associated, tokenId, accountId } });
}));

router.post('/acl/associate/prepare', protect, isUniversity,
  [
    body('accountId').optional().isString().trim(),
    body('tokenId').optional().isString().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const tokenId = String(req.body.tokenId || process.env.ACL_TOKEN_ID || '').trim();
    const accountId = String(req.body.accountId || req.user?.hederaAccountId || '').trim();
    if (!tokenId || !accountId) {
      return res.status(400).json({ success: false, message: 'Faltan tokenId o accountId' });
    }
    try { await hederaService.connect(); } catch {}
    const bytesBase64 = await hederaService.prepareTokenAssociateTransaction(accountId, tokenId);
    return res.status(200).json({ success: true, data: { transactionBytesBase64: bytesBase64 } });
  })
);

router.post('/acl/associate/submit', protect, isUniversity,
  [
    body('signedTransactionBytes').notEmpty().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { signedTransactionBytes } = req.body;
    try { await hederaService.connect(); } catch {}
    const result = await hederaService.executeSignedTransaction(signedTransactionBytes);
    const status = result?.receipt?.status?.toString ? result.receipt.status.toString() : 'SUCCESS';
    return res.status(200).json({ success: true, data: { status, transactionId: result.transactionId } });
  })
);

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

router.get('/acl/balance', protect, isUniversity, asyncHandler(async (req, res) => {
  const tokenId = String(process.env.ACL_TOKEN_ID || '').trim();
  const accountId = String(req.user?.hederaAccountId || '').trim();
  if (!tokenId || !accountId) {
    return res.status(200).json({ success: true, data: { tokenId, accountId, balance: '0' } });
  }
  try { await hederaService.connect(); } catch {}
  let balance = '0';
  try {
    if (hederaService.isEnabled()) {
      balance = await hederaService.getTokenBalance(accountId, tokenId);
    }
  } catch {}
  res.status(200).json({ success: true, data: { tokenId, accountId, balance } });
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

    let existingToken;
    try {
      existingToken = await Token.findOne({ tokenSymbol, universityId: user.id });
    } catch (e) {
      if (useMem()) {
        existingToken = memStore.tokens.find(t => t.tokenSymbol === tokenSymbol && t.universityId === user.id);
      }
    }

    if (existingToken) {
      return res.status(409).json({ success: false, message: `Token symbol '${tokenSymbol}' already exists for your university.` });
    }

    const result = await hederaService.createAcademicToken({
      tokenName: `${user.universityName} - ${tokenName}`,
      tokenSymbol,
      tokenMemo: tokenMemo || `Academic credential from ${user.universityName}`,
      treasuryAccountId: user.hederaAccountId || null,
    });

    try {
      if (!useMem()) {
        await Token.create({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: user.id });
      } else {
        memStore.tokens.push({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: user.id, createdAt: new Date() });
      }
    } catch {}

    logger.info(`🎓 Academic token created by ${user.universityName}: ${result.tokenId}`);
    res.status(201).json({
      success: true,
      message: 'Academic token created successfully',
      data: result,
    });
  })
);

router.post('/create-payment-token', protect, isUniversity,
  [
    body('tokenName').notEmpty().withMessage('Token name is required').trim().escape(),
    body('tokenSymbol').notEmpty().withMessage('Token symbol is required').trim().escape(),
    body('tokenMemo').optional().isString().trim().escape(),
    body('decimals').optional().isInt({ min: 0, max: 18 }),
    body('initialSupply').optional().isInt({ min: 0 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenName, tokenSymbol, tokenMemo, decimals, initialSupply } = req.body;
    const { user } = req;

    let existingToken;
    try {
      existingToken = await Token.findOne({ tokenSymbol, universityId: user.id });
    } catch (e) {
      if (useMem()) {
        existingToken = memStore.tokens.find(t => t.tokenSymbol === tokenSymbol && t.universityId === user.id);
      }
    }

    if (existingToken) {
      return res.status(409).json({ success: false, message: `Token symbol '${tokenSymbol}' already exists for your university.` });
    }

    const result = await hederaService.createPaymentToken({
      tokenName: `${user.universityName} - ${tokenName}`,
      tokenSymbol,
      tokenMemo: tokenMemo || `Payment token for ${user.universityName}`,
      treasuryAccountId: user.hederaAccountId || null,
      decimals,
      initialSupply,
    });

    try {
      if (!useMem()) {
        await Token.create({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: user.id });
      } else {
        memStore.tokens.push({ tokenId: result.tokenId, tokenName, tokenSymbol, universityId: user.id, createdAt: new Date() });
      }
    } catch {}

    logger.info(`💳 Payment token created by ${user.universityName}: ${result.tokenId}`);
    res.status(201).json({
      success: true,
      message: 'Payment token created successfully',
      data: result,
    });
  })
);

/**
 * @route POST /api/university/sign-dpa
 * @desc Sign the Data Processing Agreement (DPA)
 * @access Private (University only)
 */
router.post('/sign-dpa', protect, isUniversity, asyncHandler(async (req, res) => {
    const { user } = req;
    
    if (user.dpaAccepted) {
        return res.status(200).json({ success: true, message: 'DPA already signed.', data: { dpaSignedAt: user.dpaSignedAt } });
    }

    user.legalTermsAccepted = true;
    user.dpaAccepted = true;
    user.dpaSignedAt = new Date();
    
    // Generate a Master Encryption Key if not exists
    if (!user.masterEncryptionKey) {
        user.masterEncryptionKey = encryptionService.generateKey();
    }

    await user.save();

    // Log the agreement signing
    await AuditLog.create({
        institutionId: user.id,
        action: 'AGREEMENT_SIGNED',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date(),
        details: {
            signedAt: user.dpaSignedAt,
            agreementVersion: 'v1.0-2026'
        }
    });

    res.status(200).json({ 
        success: true, 
        message: 'Data Processing Agreement (DPA) signed successfully.',
        data: {
            dpaSignedAt: user.dpaSignedAt,
            legalTermsAccepted: true
        }
    });
}));

router.post('/issue-credential', protect, isUniversity,
  [
    body('tokenId').notEmpty().trim().escape(),
    body('uniqueHash').notEmpty().trim().escape(),
    body('ipfsURI').notEmpty().trim(),
    body('networks').optional().isArray(),
    body('degree').optional().isString().trim(),
    body('studentName').optional().isString().trim(),
    body('graduationDate').optional().isString().trim(),
    body('recipientAccountId').optional().isString().trim(),
    body('image').optional().isString().trim(),
    body('expiryDate').optional().isString().trim(),
    body('consentConfirmed').isBoolean().withMessage('You must confirm consent/legal basis for issuance'),
  ],
  validate,
  associationGuard,
  asyncHandler(async (req, res) => {
    const { tokenId, uniqueHash, ipfsURI, recipientAccountId, degree, studentName, graduationDate, image, expiryDate, networks, consentConfirmed, encryption } = req.body;
    const { user } = req;
    
    // Legal Checks
    if (!user.legalTermsAccepted) {
        return res.status(403).json({ success: false, message: 'Must accept legal terms (DPA) before issuing credentials.' });
    }
    if (!consentConfirmed) {
        return res.status(400).json({ success: false, message: 'Consent confirmation is required for legal compliance.' });
    }

    const network = process.env.HEDERA_NETWORK || 'testnet';
    try {
      const requested = Array.isArray(networks) ? networks.map(n=>String(n).toLowerCase()) : [];
      const allowed = getAllowedNetworks(user.plan);
      for (const n of requested) {
        if (!allowed.includes(n)) {
          return res.status(403).json({ success: false, message: `Tu plan actual no soporta esta red: ${n.toUpperCase()}` });
        }
      }
      const enableOnChain = String(process.env.ENABLE_ONCHAIN_VALIDATION || '1') === '1';
      const hasContract = !!process.env.ACADEMIC_LEDGER_CONTRACT_ID;
      const canOnChain = enableOnChain && hasContract && hederaService.isEnabled();
      if (canOnChain) {
        await hederaService.requestCredentialOnChain(uniqueHash, ipfsURI, recipientAccountId || '0.0.0');
      }

      // 1. Anchor to External Chains FIRST to get proofs
      let xrp = null;
      let algo = null;

      const enableXrpEnv = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
      const enableXrpByPlan = allowed.includes('xrp');
      const enableXrpRequested = requested.length ? requested.includes('xrp') : enableXrpByPlan;
      if (enableXrpEnv && enableXrpRequested) {
        try {
          await xrpService.connect();
          const anchorTitle = studentName ? `${degree || 'Credential'} - ${studentName} - ${user.universityName}` : `${degree || 'Credential'} - ${user.universityName}`;
          // Serial number is not yet known, pass 'pending' or 0.
          const a = await xrpService.anchor({ 
            certificateHash: uniqueHash, 
            hederaTokenId: tokenId, 
            serialNumber: 'pending', 
            timestamp: new Date().toISOString(), 
            title: anchorTitle, 
            issuer: user.universityName 
          });
          xrp = a;
        } catch (e) {
            logger.warn(`XRP Anchor failed pre-mint: ${e.message}`);
        }
      }

      const enableAlgoEnv = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
      const enableAlgoByPlan = allowed.includes('algorand');
      const enableAlgoRequested = requested.length ? requested.includes('algorand') : enableAlgoByPlan;
      if (enableAlgoEnv && enableAlgoRequested) {
        try {
          const algorandService = require('../services/algorandService');
          await algorandService.connect();
          const a = await algorandService.anchor({
            certificateHash: uniqueHash,
            hederaTokenId: tokenId,
            serialNumber: 'pending',
            timestamp: new Date().toISOString(),
          });
          algo = a;
        } catch (e) {
            logger.warn(`Algorand Anchor failed pre-mint: ${e.message}`);
        }
      }

      // 2. Mint on Hedera with external proofs
      const mint = await hederaService.mintAcademicCredential(tokenId, {
        tokenId,
        uniqueHash,
        ipfsURI,
        degree,
        studentName,
        graduationDate,
        university: user.universityName,
        image,
        expiryDate,
        xrpTxHash: xrp?.xrpTxHash,
        algoTxId: algo?.algoTxId
      });

      // 2.4 Get next Global Status List Index
      let nextStatusListIndex = 0;
      try {
        const Sequence = require('../models/Sequence');
        nextStatusListIndex = await Sequence.getNext('statusListIndex');
      } catch (e) {
        logger.warn(`Failed to get next statusListIndex (using fallback): ${e.message}`);
        // Fallback (unsafe for high concurrency but better than 0)
        const lastCred = await Credential.findOne({ statusListIndex: { $exists: true } }).sort({ statusListIndex: -1 });
        nextStatusListIndex = (lastCred && typeof lastCred.statusListIndex === 'number') ? lastCred.statusListIndex + 1 : 0;
      }

      // 2.5 Generate W3C Verifiable Credential (VC)
      let vcJwt = null;
      try {
        const agent = veramoSecure.getBaseAgent();
        const vc = await agent.createVerifiableCredential({
          credential: {
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
            type: ['VerifiableCredential', 'AcademicCredential'],
            issuer: { id: user.did || `did:web:localhost:3001` }, 
            issuanceDate: new Date().toISOString(),
            credentialStatus: {
              id: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list#${nextStatusListIndex}`,
              type: 'StatusList2021Entry',
              statusPurpose: 'revocation',
              statusListIndex: String(nextStatusListIndex),
              statusListCredential: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list`
            },
            credentialSubject: {
              id: recipientAccountId ? `did:pkh:hedera:testnet:${recipientAccountId}` : `did:web:example.com:${(studentName||'student').replace(/\s+/g, '')}`,
              degree: degree || 'Academic Credential',
              studentName,
              university: user.universityName,
              uniqueHash,
              ipfsURI,
              tokenId,
              serialNumber: mint.serialNumber
            }
          },
          proofFormat: 'jwt',
          save: false
        });
        vcJwt = typeof vc === 'string' ? vc : (vc.proof && vc.proof.jwt ? vc.proof.jwt : JSON.stringify(vc));
      } catch (vcErr) {
        logger.warn(`VC Generation failed: ${vcErr.message}`);
      }

      // 3. Save to DB
      try {
        const credData = { 
            tokenId, 
            serialNumber: mint.serialNumber, 
            universityId: user.id, 
            studentAccountId: recipientAccountId || null, 
            uniqueHash, 
            ipfsURI,
            vcJwt, // Store the W3C VC
            statusListIndex: nextStatusListIndex,
            encryption: encryption || { isEncrypted: false }, // Store encryption metadata
            externalProofs: {
                xrpTxHash: xrp?.xrpTxHash,
                algoTxId: algo?.algoTxId
            }
        };

        if (!useMem()) {
          await Credential.create(credData);
          
          // Audit Log
          await AuditLog.create({
              institutionId: user.id,
              action: 'CREDENTIAL_ISSUED',
              ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
              blockchainTxHash: mint.transactionId, // Store Hedera Tx ID
              documentHash: uniqueHash,
              cid: ipfsURI ? ipfsURI.replace('ipfs://', '') : 'unknown',
              timestamp: new Date(),
              details: {
                  tokenId,
                  serialNumber: mint.serialNumber,
                  studentName,
                  isEncrypted: !!encryption?.isEncrypted
              }
          });
        } else {
          memStore.credentials.push({ ...credData, createdAt: new Date() });
        }
      } catch (dbErr) {
         logger.error(`Failed to save credential/audit to DB: ${dbErr.message}`);
      }

      let transfer = null;
      if (recipientAccountId) {
        transfer = await hederaService.transferCredentialToStudent(tokenId, mint.serialNumber, recipientAccountId);
      }

      const nftId = `${tokenId}-${mint.serialNumber}`;
      const hashscanUrl = `https://hashscan.io/${network}/nft/${nftId}`;
      const xrplUrl = xrp?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${xrp.xrpTxHash}` : null;
      
      // Generate LinkedIn One-Click URL for n8n/Webhook
      let linkedInUrl = null;
      try {
        const certName = degree || 'Academic Credential';
        const cid = ipfsURI ? ipfsURI.replace('ipfs://', '') : '';
        const certUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
        const issueDate = new Date();
        const issueYear = issueDate.getFullYear();
        const issueMonth = issueDate.getMonth() + 1;
        
        const liUrl = new URL('https://www.linkedin.com/profile/add');
        liUrl.searchParams.append('startTask', 'CERTIFICATION_NAME');
        liUrl.searchParams.append('name', certName);
        liUrl.searchParams.append('issueYear', issueYear.toString());
        liUrl.searchParams.append('issueMonth', issueMonth.toString());
        liUrl.searchParams.append('certUrl', certUrl);
        liUrl.searchParams.append('certId', cid);
        linkedInUrl = liUrl.toString();
      } catch (e) {}

      // Trigger Automation for direct issuance
      try {
        const automationService = require('../services/automationService');
        await automationService.triggerEvent('credential_issued', {
          university: user.universityName,
          studentName: studentName || 'Student',
          degree: degree || 'Academic Credential',
          tokenId: tokenId,
          serialNumber: mint.serialNumber,
          txId: mint.transactionId,
          ipfsCid: mint.ipfs?.cid || (ipfsURI ? ipfsURI.replace('ipfs://', '') : ''),
          timestamp: new Date().toISOString(),
          linkedInUrl
        });
      } catch (autoErr) {
        logger.warn('Automation trigger failed in issue-credential:', autoErr.message);
      }

      res.status(201).json({ success: true, data: { nftId, hashscanUrl, mintTxId: mint.transactionId, transfer, xrpTxHash: xrp?.xrpTxHash || null, xrplUrl, algoTxId: algo?.algoTxId || null, linkedInUrl } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

/**
 * @route DELETE /api/university/credential/:id/forget
 * @desc Implements "Right to be Forgotten" by deleting encryption keys
 * @access Private (University only)
 */
router.delete('/credential/:id/forget', protect, isUniversity, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user } = req;
    
    const credential = await Credential.findOne({ _id: id, universityId: user.id });
    if (!credential) {
        return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    if (!credential.encryption || !credential.encryption.isEncrypted) {
        return res.status(400).json({ success: false, message: 'Credential is not encrypted. Cannot perform cryptographic deletion.' });
    }

    // "Forget" the key
    credential.encryption.key = null;
    credential.encryption.algo = 'deleted';
    credential.isRevoked = true; // Also mark as revoked
    credential.revocationReason = 'RIGHT_TO_BE_FORGOTTEN';
    
    await credential.save();

    // Log the action
    await AuditLog.create({
        institutionId: user.id,
        action: 'CREDENTIAL_REVOKED',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date(),
        details: {
            credentialId: id,
            reason: 'Right to be Forgotten (GDPR)',
            action: 'Encryption Key Deletion'
        }
    });

    res.status(200).json({ success: true, message: 'Credential encryption key deleted. File is now permanently inaccessible.' });
}));

/**
 * @route PATCH /api/university/credential/:id/revoke
 * @desc Revoke a credential (updates Status List and DB)
 * @access Private (University only)
 */
router.patch('/credential/:id/revoke', protect, isUniversity, 
    [
        body('reason').notEmpty().withMessage('Revocation reason is required').trim().escape()
    ],
    validate,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const { user } = req;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Lazy load service to avoid circular dependency if any
        const issuanceService = require('../services/issuanceService');

        const result = await issuanceService.revokeCredential(id, user.id, reason, ipAddress);

        res.status(200).json({
            success: true,
            message: 'Credential revoked successfully.',
            data: result
        });
    })
);

router.post('/prepare-issuance', protect, isUniversity, 
  [
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('uniqueHash').notEmpty().withMessage('uniqueHash is required').trim().escape(),
    body('ipfsURI').notEmpty().withMessage('ipfsURI is required').trim(),
    body('networks').optional().isArray(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    try {
      const { user } = req;
      const { tokenId, ...credentialData } = req.body;
      const requested = Array.isArray(credentialData.networks) ? credentialData.networks.map(n=>String(n).toLowerCase()) : [];
      const allowed = getAllowedNetworks(user.plan);
      for (const n of requested) {
        if (!allowed.includes(n)) {
          return res.status(403).json({ success: false, message: `Tu plan actual no soporta esta red: ${n.toUpperCase()}` });
        }
      }

      const token = await Token.findOne({ tokenId, universityId: user.id });
      if (!token) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this token.' });
      }

      const transactionRecord = await Transaction.create({
        universityId: user.id,
        type: 'CREDENTIAL_ISSUANCE',
        status: 'PENDING_ISSUANCE',
        credentialData: req.body,
      });

      res.status(200).json({
        success: true,
        message: 'Issuance prepared.',
        data: {
          transactionId: transactionRecord.id,
        }
      });
    } catch (e) {
      console.error('DEBUG prepare-issuance error', e);
      throw e;
    }
  })
);

router.post('/execute-issuance', protect, isUniversity, 
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('signedPaymentTransactionBytes').optional({ nullable: true }).isString(),
    body('xrpTxHash').optional({ nullable: true }).isString(),
    body('networks').optional().isArray(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { transactionId, signedPaymentTransactionBytes, xrpTxHash, networks } = req.body;
    const { user } = req;
    const { Credential, Partner } = require('../models');

    // Credit Check
    if ((user.credits || 0) < 1) {
      return res.status(402).json({ success: false, message: 'Créditos insuficientes. Por favor recarga tu saldo.' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.universityId !== user.id) {
      return res.status(404).json({ success: false, message: 'Transaction not found or you are not authorized.' });
    }

    if (transaction.status !== 'PENDING_PAYMENT' && transaction.status !== 'PENDING_ISSUANCE') {
        return res.status(409).json({ success: false, message: `Transaction is already in progress or completed with status: ${transaction.status}` });
    }

    try {
      const { credentialData } = transaction;
      const requestedBody = Array.isArray(networks) ? networks.map(n=>String(n).toLowerCase()) : [];
      const requestedSaved = Array.isArray(credentialData.networks) ? credentialData.networks.map(n=>String(n).toLowerCase()) : [];
      const requested = requestedBody.length ? requestedBody : requestedSaved;
      const allowed = getAllowedNetworks(user.plan);
      for (const n of requested) {
        if (!allowed.includes(n)) {
          return res.status(403).json({ success: false, message: `Tu plan actual no soporta esta red: ${n.toUpperCase()}` });
        }
      }

      // 1. On-chain validation via Smart Contract (optional)
      const enableOnChain = String(process.env.ENABLE_ONCHAIN_VALIDATION || '1') === '1';
      const hasContract = !!process.env.ACADEMIC_LEDGER_CONTRACT_ID;
      const canOnChain = enableOnChain && hasContract && hederaService.isEnabled();
      if (canOnChain) {
        await hederaService.requestCredentialOnChain(
          credentialData.uniqueHash,
          credentialData.ipfsURI,
          credentialData.recipientAccountId || '0.0.0'
        );
      }

      // 2. Proceed without payment
      
      // 2.5 Anchor to External Chains FIRST
      let xrpAnchor = null;
      let algoAnchor = null;
      const cid = credentialData.ipfsURI ? credentialData.ipfsURI.replace('ipfs://', '') : null;

      const enableXrp2 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
      const wantXrp = requested.length ? requested.includes('xrp') : allowed.includes('xrp');
      if (enableXrp2 && wantXrp) {
        try {
          await xrpService.connect();
          const anchorTitle = credentialData.studentName ? `${credentialData.degree} - ${credentialData.studentName} - ${user.universityName}` : `${credentialData.degree || 'Credential'} - ${user.universityName}`;
          xrpAnchor = await xrpService.anchor({
            certificateHash: credentialData.uniqueHash,
            hederaTokenId: credentialData.tokenId,
            serialNumber: 'pending',
            hederaTopicId: credentialData.hederaTopicId,
            hederaSequence: credentialData.hederaSequence,
            timestamp: new Date().toISOString(),
            title: anchorTitle,
            issuer: user.universityName,
            cid: cid // Pass CID for dual verification
          });
        } catch (e) {
             logger.warn(`XRP Anchor failed pre-mint in execute-issuance: ${e.message}`);
             // Retry Logic: Enqueue for background retry
             if (isRedisConnected()) {
                issuanceQueue.add('retry-anchor', {
                    type: 'xrp',
                    credentialData: { ...credentialData, cid },
                    universityName: user.universityName,
                    reason: e.message
                }).catch(err => logger.error('Failed to enqueue XRP retry', err));
             }
        }
      }

      const enableAlgo = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
      const wantAlgo = requested.length ? requested.includes('algorand') : allowed.includes('algorand');
      if (enableAlgo) {
        try {
          const algorandService = require('../services/algorandService');
          await algorandService.connect();
          algoAnchor = wantAlgo ? await algorandService.anchor({
            certificateHash: credentialData.uniqueHash,
            hederaTokenId: credentialData.tokenId,
            serialNumber: 'pending',
            timestamp: new Date().toISOString(),
            cid: cid // Pass CID for dual verification
          }) : null;
        } catch (e) {
             logger.warn(`Algorand Anchor failed pre-mint in execute-issuance: ${e.message}`);
             // Retry Logic
             if (isRedisConnected()) {
                issuanceQueue.add('retry-anchor', {
                    type: 'algorand',
                    credentialData: { ...credentialData, cid },
                    universityName: user.universityName,
                    reason: e.message
                }).catch(err => logger.error('Failed to enqueue Algorand retry', err));
             }
        }
      }

      // 3. Mint the NFT on HTS
      const mintResult = await hederaService.mintAcademicCredential(credentialData.tokenId, {
        ...credentialData,
        university: user.universityName,
        xrpTxHash: xrpAnchor?.xrpTxHash,
        algoTxId: algoAnchor?.algoTxId
      });

      transaction.issuanceTransactionId = mintResult.transactionId;

      // Generate LinkedIn One-Click URL (Moved up for Automation)
      let linkedInUrl = null;
      try {
        const certName = credentialData.degree || 'Academic Credential';
        const cid = credentialData.ipfsURI ? credentialData.ipfsURI.replace('ipfs://', '') : '';
        const certUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
        const issueDate = new Date();
        const issueYear = issueDate.getFullYear();
        const issueMonth = issueDate.getMonth() + 1;
        
        const liUrl = new URL('https://www.linkedin.com/profile/add');
        liUrl.searchParams.append('startTask', 'CERTIFICATION_NAME');
        liUrl.searchParams.append('name', certName);
        liUrl.searchParams.append('issueYear', issueYear.toString());
        liUrl.searchParams.append('issueMonth', issueMonth.toString());
        liUrl.searchParams.append('certUrl', certUrl);
        liUrl.searchParams.append('certId', cid);
        linkedInUrl = liUrl.toString();
      } catch (e) {}

      // 4. Trigger Automation (n8n)
      try {
        const automationService = require('../services/automationService');
        await automationService.triggerEvent('credential_issued', {
          university: user.universityName,
          studentName: credentialData.studentName,
          degree: credentialData.degree,
          tokenId: credentialData.tokenId,
          serialNumber: mintResult.serialNumber,
          txId: mintResult.transactionId,
          ipfsCid: mintResult.ipfs?.cid,
          filecoinCid: mintResult.filecoin?.cid,
          timestamp: new Date().toISOString(),
          linkedInUrl // Added for n8n Agéntico
        });
      } catch (autoErr) {
        logger.warn('Automation trigger failed:', autoErr.message);
      }
      transaction.status = 'ISSUANCE_COMPLETE';
      await transaction.save();

      // 4.5 Generate W3C VC
      let vcJwt = null;
      try {
        const agent = veramoSecure.getBaseAgent();
        const vc = await agent.createVerifiableCredential({
          credential: {
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
            type: ['VerifiableCredential', 'AcademicCredential'],
            issuer: { id: `did:web:localhost:3001` },
            issuanceDate: new Date().toISOString(),
            credentialStatus: {
              id: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list#${mintResult.serialNumber}`,
              type: 'StatusList2021Entry',
              statusPurpose: 'revocation',
              statusListIndex: mintResult.serialNumber,
              statusListCredential: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list`
            },
            credentialSubject: {
              id: credentialData.recipientAccountId ? `did:pkh:hedera:testnet:${credentialData.recipientAccountId}` : `did:web:example.com:${(credentialData.studentName||'student').replace(/\s+/g, '')}`,
              degree: credentialData.degree || 'Academic Credential',
              studentName: credentialData.studentName,
              university: user.universityName,
              uniqueHash: credentialData.uniqueHash,
              ipfsURI: credentialData.ipfsURI,
              tokenId: credentialData.tokenId,
              serialNumber: mintResult.serialNumber
            }
          },
          proofFormat: 'jwt',
          save: false
        });
        vcJwt = typeof vc === 'string' ? vc : (vc.proof && vc.proof.jwt ? vc.proof.jwt : JSON.stringify(vc));
      } catch (vcErr) {
        logger.warn(`VC Generation failed in execute-issuance: ${vcErr.message}`);
      }

      // 4. Save credential record to local DB
      try {
        const credData = {
            tokenId: credentialData.tokenId,
            serialNumber: mintResult.serialNumber,
            universityId: user.id,
            studentAccountId: credentialData.recipientAccountId || null,
            uniqueHash: credentialData.uniqueHash,
            ipfsURI: credentialData.ipfsURI,
            vcJwt,
            externalProofs: {
                xrpTxHash: xrpAnchor?.xrpTxHash,
                algoTxId: algoAnchor?.algoTxId
            }
        };

        if (!useMem()) {
          await Credential.create(credData);
        } else {
          memStore.credentials.push({
            ...credData,
            createdAt: new Date(),
          });
        }
      } catch {}

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

      // Deduct Credit
      await User.updateOne({ _id: user.id }, { $inc: { credits: -1 } });
      try {
        await Partner.updateMany({ universityId: user.id }, { $inc: { credits: -1 } });
      } catch {}

      logger.info(`🎓 Credential issued for DB transaction ${transaction.id}. NFT TxID: ${mintResult.transactionId}`);

      // linkedInUrl is already generated above for automation

      res.status(201).json({
        success: true,
        message: 'Credential validated on-chain and issued successfully.',
        data: {
          mint: mintResult,
          transfer: transferResult,
          linkedInUrl
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

// Hedera Consensus Service (HCS) - Registro de calificaciones
router.post('/grades/create-topic', protect, isUniversity,
  [ body('memo').optional().isString().trim() ],
  validate,
  asyncHandler(async (req, res) => {
    const { memo } = req.body;
    const result = await hederaService.createGradesTopic(memo || `Grades · ${req.user.universityName}`);
    res.status(201).json({ success: true, message: 'Grades topic created', data: result });
  })
);

router.post('/grades/publish', protect, isUniversity,
  [
    body('topicId').notEmpty().withMessage('topicId is required').trim(),
    body('tokenId').optional().isString().trim(),
    body('serialNumber').optional().isString().trim(),
    body('studentId').notEmpty().withMessage('studentId is required').trim(),
    body('grade').notEmpty().withMessage('grade is required').trim(),
    body('courseCode').optional().isString().trim(),
    body('evaluator').optional().isString().trim(),
    body('comments').optional().isString().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { topicId, tokenId, serialNumber, studentId, grade, courseCode, evaluator, comments } = req.body;
    const payload = {
      type: 'GRADE_RECORD',
      university: req.user.universityName,
      studentId,
      grade,
      courseCode: courseCode || null,
      credentialRef: tokenId && serialNumber ? `${tokenId}-${serialNumber}` : null,
      evaluator: evaluator || null,
      comments: comments || null,
      timestamp: new Date().toISOString(),
    };
    const result = await hederaService.publishGrade(topicId, payload);
    res.status(201).json({ success: true, message: 'Grade published to HCS', data: result });
  })
);

// Encolar emisión masiva
router.post('/issue-bulk', protect, isUniversity,
  [
    body('tokenId').notEmpty().withMessage('Token ID is required').trim().escape(),
    body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required'),
    body('roomId').optional().isString(),
    body('consentConfirmed').custom(val => val === true).withMessage('Debe confirmar legalmente que cuenta con el consentimiento de los titulares o base legal para la emisión.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, credentials, roomId } = req.body;
    const { user } = req;

    // 0. Legal Check: Institution must have accepted terms
    if (!user.legalTermsAccepted) {
        return res.status(403).json({ 
            success: false, 
            message: 'Debe aceptar los Términos Legales y DPA antes de emitir credenciales.' 
        });
    }
    if (isRedisConnected()) {
      const job = await issuanceQueue.add('bulk-issuance', {
        tokenId,
        credentials,
        universityId: user.id,
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
          // 1. Anchor External
          let xrp = null;
          let algo = null;

          const enableXrp3 = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
          if (enableXrp3) {
            try {
              await xrpService.connect();
              xrp = await xrpService.anchor({
                certificateHash: credentialData.uniqueHash,
                hederaTokenId: tokenId,
                serialNumber: 'pending',
                hederaTopicId: credentialData.hederaTopicId,
                hederaSequence: credentialData.hederaSequence,
                timestamp: new Date().toISOString(),
              });
            } catch {}
          }

          const enableAlgo = (process.env.ALGORAND_ENABLED === 'true' || process.env.ALGORAND_ENABLE === '1' || process.env.ENABLE_ALGORAND === '1');
          if (enableAlgo) {
            try {
              const algorandService = require('../services/algorandService');
              await algorandService.connect();
              algo = await algorandService.anchor({
                certificateHash: credentialData.uniqueHash,
                hederaTokenId: tokenId,
                serialNumber: 'pending',
                timestamp: new Date().toISOString(),
              });
            } catch {}
          }

          // 2. Mint
          const mintResult = await hederaService.mintAcademicCredential(tokenId, {
            ...credentialData,
            university: user.universityName,
            xrpTxHash: xrp?.xrpTxHash,
            algoTxId: algo?.algoTxId
          });

          // 2.5 Generate W3C Verifiable Credential (VC)
          let vcJwt = null;
          try {
            const agent = veramoSecure.getBaseAgent();
            const vc = await agent.createVerifiableCredential({
              credential: {
                '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
                type: ['VerifiableCredential', 'AcademicCredential'],
                issuer: { id: user.did || `did:web:localhost:3001` }, 
              issuanceDate: new Date().toISOString(),
              credentialStatus: {
                id: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list#${mintResult.serialNumber}`,
                type: 'StatusList2021Entry',
                statusPurpose: 'revocation',
                statusListIndex: mintResult.serialNumber,
                statusListCredential: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/verification/status-list`
              },
              credentialSubject: {
                id: credentialData.recipientAccountId ? `did:pkh:hedera:testnet:${credentialData.recipientAccountId}` : `did:web:example.com:${(credentialData.studentName||'student').replace(/\s+/g, '')}`,
                degree: credentialData.degree || 'Academic Credential',
                studentName: credentialData.studentName,
                university: user.universityName,
                uniqueHash: credentialData.uniqueHash,
                ipfsURI: credentialData.ipfsURI,
                tokenId: tokenId,
                serialNumber: mintResult.serialNumber
              }
              },
              proofFormat: 'jwt',
              save: false
            });
            vcJwt = typeof vc === 'string' ? vc : (vc.proof && vc.proof.jwt ? vc.proof.jwt : JSON.stringify(vc));
          } catch (vcErr) {
            logger.warn(`VC Generation failed in bulk fallback: ${vcErr.message}`);
          }

          // 3. Save
          try {
            const credData = {
                tokenId: tokenId,
                serialNumber: mintResult.serialNumber,
                universityId: user.id,
                studentAccountId: credentialData.recipientAccountId || null,
                uniqueHash: credentialData.uniqueHash,
                ipfsURI: credentialData.ipfsURI,
                vcJwt, // Store W3C VC
                externalProofs: {
                    xrpTxHash: xrp?.xrpTxHash,
                    algoTxId: algo?.algoTxId
                }
            };
            if (!useMem()) {
              await Credential.create(credData);
            } else {
              memStore.credentials.push({ ...credData, createdAt: new Date() });
            }
          } catch {}

          // 4. Transfer
          let transferResult = null;
          if (credentialData.recipientAccountId) {
            transferResult = await hederaService.transferCredentialToStudent(
              tokenId,
              mintResult.serialNumber,
              credentialData.recipientAccountId
            );
          }


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

  const tokens = useMem() ? memStore.tokens.filter(t => t.universityId === user.id).sort((a,b)=> b.createdAt - a.createdAt) : await Token.find({ universityId: user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      tokens,
      university: user.universityName
    }
  });
}));

router.get('/credentials', protect, isUniversity, asyncHandler(async (req, res) => {
  const { user } = req;
  const { Credential } = require('../models');
  const { tokenId, accountId, limit = 50, page = 1, format, sort = 'desc', sortBy = 'createdAt' } = req.query;
  const lim = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const query = { universityId: user.id };
  if (tokenId) query.tokenId = tokenId;
  if (accountId) query.studentAccountId = accountId;
  const sortDir = (String(sort).toLowerCase() === 'asc') ? 1 : -1;
  const list = useMem()
    ? memStore.credentials.filter(c => (
      c.universityId === user.id &&
      (!tokenId || c.tokenId === tokenId) &&
      (!accountId || c.studentAccountId === accountId)
    )).sort((a,b)=> sortDir === 1 ? (a[sortBy] > b[sortBy] ? 1 : -1) : (a[sortBy] < b[sortBy] ? 1 : -1)).slice((pg - 1) * lim, ((pg - 1) * lim) + lim)
    : await Credential.find(query).sort({ [sortBy]: sortDir }).skip((pg - 1) * lim).limit(lim);
  const total = useMem()
    ? memStore.credentials.filter(c => (
      c.universityId === user.id &&
      (!tokenId || c.tokenId === tokenId) &&
      (!accountId || c.studentAccountId === accountId)
    )).length
    : await Credential.countDocuments(query);
  if (format === 'csv') {
    const rows = [['tokenId','serialNumber','ipfsURI','uniqueHash','studentAccountId','createdAt']].concat(
      list.map(c => [c.tokenId, c.serialNumber, c.ipfsURI, c.uniqueHash, c.studentAccountId || '', (c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt)])
    );
    const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : (v ?? '')).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="credentials.csv"');
    return res.status(200).send(csv);
  }
  const from = total === 0 ? 0 : ((pg - 1) * lim) + 1;
  const to = total === 0 ? 0 : Math.min(pg * lim, total);
  const enableXrp = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
  let credentialsOut;
  if (useMem()) {
    credentialsOut = list.map(c => ({ ...c, xrpAnchor: null }));
  } else if (enableXrp) {
    const { XrpAnchor } = require('../models');
    credentialsOut = await Promise.all(list.map(async (c) => {
      try {
        const a = await XrpAnchor.findOne({ hederaTokenId: c.tokenId, serialNumber: c.serialNumber }).sort({ createdAt: -1 });
        const o = c.toObject();
        o.xrpAnchor = a ? { xrpTxHash: a.xrpTxHash, network: a.network, status: a.status } : null;
        return o;
      } catch {
        return c.toObject();
      }
    }));
  } else {
    credentialsOut = list.map(c => c.toObject());
  }
  res.status(200).json({ success: true, data: { credentials: credentialsOut, meta: { total, page: pg, limit: lim, pages: Math.ceil(total / lim), hasMore: (pg * lim) < total, from, to, sort: sortDir === 1 ? 'asc' : 'desc', sortBy } } });
}));

// Catálogo público de instituciones
router.get('/catalog', asyncHandler(async (req, res) => {
  const disableMongo = process.env.DISABLE_MONGO === '1';
  if (disableMongo) {
    return res.status(200).json({ success: true, data: { universities: [] } });
  }
  const universities = await User.find({ role: 'university', isActive: true }).select('id universityName email createdAt');
  const ids = universities.map(u => u.id);
  const tokensByUni = await Token.aggregate([{ $match: { universityId: { $in: ids } } }, { $group: { _id: '$universityId', count: { $sum: 1 } } }]);
  const credsByUni = await Credential.aggregate([{ $match: { universityId: { $in: ids } } }, { $group: { _id: '$universityId', count: { $sum: 1 } } }]);
  const tokenMap = Object.fromEntries(tokensByUni.map(t => [t._id, t.count]));
  const credMap = Object.fromEntries(credsByUni.map(c => [c._id, c.count]));
  const catalog = universities.map(u => ({
    id: u.id,
    name: u.universityName,
    email: u.email,
    tokens: tokenMap[u.id] || 0,
    credentials: credMap[u.id] || 0,
    since: u.createdAt,
  }));
  res.status(200).json({ success: true, data: { universities: catalog } });
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
    body('credentials').isArray({ min: 1 }).withMessage('At least one credential is required'),
    body('consentConfirmed').isBoolean().withMessage('You must confirm consent/legal basis for issuance'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { tokenId, credentials, consentConfirmed } = req.body;
    const { user } = req;
    
    // Legal Checks
    if (!user.legalTermsAccepted) {
        return res.status(403).json({ success: false, message: 'Must accept legal terms (DPA) before issuing credentials.' });
    }
    if (!consentConfirmed) {
        return res.status(400).json({ success: false, message: 'Consent confirmation is required for legal compliance.' });
    }

    const job = await issuanceQueue.add('batch-issuance', {
      tokenId,
      credentials,
      universityName: user.universityName,
      universityId: user.id,
      universityDid: user.did,
      institutionId: user.id, // For Audit Log in worker
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
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

// Student PII Decryption Endpoint
router.post('/credentials/decrypt-pii', protect,
  [
    body('ipfsUri').notEmpty().withMessage('ipfsUri is required').isString().trim(),
    body('studentAccountId').notEmpty().withMessage('studentAccountId is required').isString().trim(),
    body('university').notEmpty().withMessage('university is required').isString().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { ipfsUri, studentAccountId, university } = req.body;
    const { user } = req;

    // Security check: Only the student themselves can decrypt their PII
    if (user.hederaAccountId !== studentAccountId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You can only decrypt your own personal data.' 
      });
    }

    try {
      // Decrypt the PII data
      const decryptedPII = await hederaService.getDecryptedStudentPII(ipfsUri, studentAccountId, university);
      
      logger.info(`🔓 PII decrypted successfully for student: ${studentAccountId}`);
      
      res.status(200).json({
        success: true,
        message: 'PII decrypted successfully',
        data: {
          studentName: decryptedPII.studentName,
          studentId: decryptedPII.studentId,
          grade: decryptedPII.grade,
          decryptedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error(`❌ Failed to decrypt PII for student ${studentAccountId}:`, error.message);
      
      if (error.message.includes('Failed to decrypt')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to decrypt PII data. Ensure you have the correct account ID and university name.' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred while decrypting your personal data.' 
      });
    }
  })
);

router.post('/upload-credential-asset', protect, isUniversity, upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    try {
        const filePath = req.file.path;
        // Parallel Uploads to Pinata (Hot) and Lighthouse (Cold) via ipfsService
        const result = await ipfsService.pinFile(filePath, req.file.originalname, req.file.mimetype);
        
        // Clean up temp file immediately after upload to free disk space
        fs.unlink(filePath, (err) => {
            if (err) logger.warn(`Failed to delete temp file: ${filePath}`);
        });

        res.status(200).json({
            success: true,
            data: {
                ipfsURI: `ipfs://${result.IpfsHash}`,
                cid: result.IpfsHash,
                filecoin: result.filecoin,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
            }
        });
    } catch (error) {
        // Clean up on error too
        if (req.file && req.file.path) {
             fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
