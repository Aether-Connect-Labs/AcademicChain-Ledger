const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const hederaService = require('../../services/hederaServices');
const xrpService = require('../../services/xrpService');
const algorandService = require('../../services/algorandService');
const verificationReportService = require('../../services/verificationReport');
const { decideChainFromRequest } = require('../../services/routingService');
const { Token, Credential } = require('../../models');
const { isConnected: isMongoConnected } = require('../../config/database');
const useMem = () => {
  const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  // In tests, prefer mocked models. In dev without DB, use in-memory.
  if (isTest) return false;
  return (process.env.DISABLE_MONGO === '1' || !isMongoConnected());
};
const mem = { tokens: [], credentials: [] };
const { validate } = require('../../middleware/validator');
const { verifyApiKey } = require('../../middleware/auth');
const apiRateLimit = require('../../middleware/apiRateLimit');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } });
const crypto = require('crypto');
const axios = require('axios');

const checkCredits = require('../../middleware/checkCredits');
const associationGuard = require('../../middleware/associationGuard');

router.get('/verify/:credentialId', apiRateLimit, asyncHandler(async (req, res) => {
    const { credentialId } = req.params;
    
    if (!credentialId) {
        return res.status(400).json({ error: 'Credential ID is required' });
    }

    try {
        const report = await verificationReportService.generateForenseReport(credentialId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
}));

router.post('/revoke', verifyApiKey, apiRateLimit, [
  body('tokenId').notEmpty().trim(),
  body('serialNumber').notEmpty().trim(),
  body('reason').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, serialNumber, reason } = req.body;
  await hederaService.connect();
  const hSubmit = await hederaService.submitRevocation(tokenId, serialNumber, reason);
  if (useMem()) {
    const idx = mem.credentials.findIndex(c => c.tokenId === tokenId && c.serialNumber === serialNumber);
    if (idx >= 0) {
      mem.credentials[idx].status = 'REVOKED';
      mem.credentials[idx].revocationReason = reason || null;
      mem.credentials[idx].revokedAt = new Date();
      mem.credentials[idx].revocationTxId = hSubmit.transactionId;
      mem.credentials[idx].revocationTopicId = hSubmit.topicId;
      mem.credentials[idx].revocationSequence = hSubmit.sequence;
      mem.credentials[idx].updatedAt = new Date();
    } else {
      mem.credentials.push({ tokenId, serialNumber, status: 'REVOKED', revocationReason: reason || null, revokedAt: new Date(), revocationTxId: hSubmit.transactionId, revocationTopicId: hSubmit.topicId, revocationSequence: hSubmit.sequence, createdAt: new Date(), updatedAt: new Date() });
    }
  } else {
    await Credential.updateOne({ tokenId, serialNumber }, { $set: { status: 'REVOKED', revocationReason: reason || null, revokedAt: new Date(), revocationTxId: hSubmit.transactionId, revocationTopicId: hSubmit.topicId, revocationSequence: hSubmit.sequence } });
  }
  res.status(200).json({
    success: true,
    message: 'Credential revoked',
    data: {
      hedera: { topicId: hSubmit.topicId, sequence: hSubmit.sequence, transactionId: hSubmit.transactionId },
    }
  });
}));

router.get('/revocations', apiRateLimit, asyncHandler(async (req, res) => {
  const tokenId = String(req.query.tokenId || '').trim();
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10) || 50));
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10) || 0);
  const startDateRaw = String(req.query.startDate || '').trim();
  const endDateRaw = String(req.query.endDate || '').trim();
  const reasonRaw = String(req.query.reason || '').trim().toLowerCase();
  const q = { status: 'REVOKED' };
  if (tokenId) q.tokenId = tokenId;
  if (startDateRaw || endDateRaw) {
    const range = {};
    if (startDateRaw) {
      const sd = new Date(startDateRaw);
      if (!isNaN(sd.getTime())) range.$gte = sd;
    }
    if (endDateRaw) {
      const ed = new Date(endDateRaw);
      if (!isNaN(ed.getTime())) range.$lte = ed;
    }
    if (Object.keys(range).length) q.revokedAt = range;
  }
  const matchReason = (txt) => {
    if (!reasonRaw) return true;
    const s = String(txt || '').toLowerCase();
    return s.includes(reasonRaw);
  };
  let list = [];
  if (useMem()) {
    list = mem.credentials
      .filter(c => c.status === 'REVOKED' && (!tokenId || c.tokenId === tokenId))
      .filter(c => {
        if (q.revokedAt) {
          const ts = c.revokedAt instanceof Date ? c.revokedAt : (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt || Date.now()));
          if (q.revokedAt.$gte && ts < q.revokedAt.$gte) return false;
          if (q.revokedAt.$lte && ts > q.revokedAt.$lte) return false;
        }
        return matchReason(c.revocationReason);
      })
      .slice(offset, offset + limit);
  } else {
    const base = await Credential.find(q).sort({ revokedAt: -1, updatedAt: -1 }).skip(offset).limit(limit).lean();
    list = base.filter(c => matchReason(c.revocationReason));
  }
  const items = list.map(c => ({
    tokenId: c.tokenId,
    serialNumber: c.serialNumber,
    status: c.status || 'REVOKED',
    revocationReason: c.revocationReason || null,
    revokedAt: c.revokedAt || c.updatedAt || null,
    hedera: {
      topicId: c.revocationTopicId || null,
      sequence: c.revocationSequence || null,
      transactionId: c.revocationTxId || null
    }
  }));
  res.status(200).json({ success: true, data: { items, paging: { limit, offset, count: items.length } } });
}));

router.get('/status/:tokenId/:serialNumber', apiRateLimit, asyncHandler(async (req, res) => {
  const { tokenId, serialNumber } = req.params;
  let cred = null;
  if (useMem()) {
    cred = mem.credentials.find(c => c.tokenId === tokenId && c.serialNumber === serialNumber) || null;
  } else {
    cred = await Credential.findOne({ tokenId, serialNumber });
  }
  if (!cred) {
    return res.status(404).json({ success: false, message: 'Credencial no encontrada' });
  }
  res.status(200).json({
    success: true,
    data: {
      status: cred.status || 'ACTIVE',
      revocationReason: cred.revocationReason || null
    }
  });
}));

const issuanceService = require('../../services/issuanceService');

router.post('/issue', verifyApiKey, apiRateLimit, associationGuard, upload.single('file'), checkCredits, [
  body('tokenId').notEmpty().trim(),
  body('uniqueHash').notEmpty().trim(),
  body('ipfsURI').optional().isString().trim(),
  body('studentName').notEmpty().trim(),
  body('degree').notEmpty().trim(),
  body('recipientAccountId').optional().isString(),
  body('image').optional().isString(),
  body('expiryDate').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, uniqueHash, studentName, degree, recipientAccountId, image, expiryDate } = req.body;
  
  // 1. Obtener token y universidad
  let token = useMem() ? mem.tokens.find(t => t.tokenId === tokenId) : await Token.findOne({ tokenId });
  if (!token && String(process.env.ALLOW_V1_TOKEN_AUTO_CREATE).toLowerCase() === 'true') {
     const name = `AcademicChain - ${degree || 'Credential'}`;
     const created = await hederaService.createAcademicToken({ tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}`, tokenMemo: `Auto-created for v1 issuance`, treasuryAccountId: process.env.HEDERA_ACCOUNT_ID || null });
     if (useMem()) {
       token = { tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` };
       mem.tokens.push(token);
     } else {
       token = await Token.create({ tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` });
     }
  }
  const universityLabel = token?.tokenName || 'AcademicChain';

  // 2. Ejecutar Lógica de Emisión Legal (Identidad + Filecoin + Anclajes)
  const legalIssuance = await issuanceService.mintLegalCredential({
      studentName,
      institution: universityLabel,
      degree,
      uniqueHash
  }, (req.file && req.file.buffer) ? req.file.buffer : null);

  const { content, blockchainEvidence } = legalIssuance;
  
  // 3. Minting en Hedera (Consenso Final)
  const creator = req.apiConsumer?.email || req.apiConsumer?.id || 'API Consumer';
  
  // Preparamos metadatos extendidos con la evidencia legal
  const mintResult = await hederaService.mintAcademicCredential(tokenId, { 
      uniqueHash, 
      ipfsURI: null, 
      pdfCid: blockchainEvidence.storage ? blockchainEvidence.storage.cid : null, 
      degree, 
      studentName, 
      university: universityLabel, 
      recipientAccountId, 
      xrpTxHash: blockchainEvidence.xrpKey, 
      algoTxId: blockchainEvidence.algorandKey, 
      image, 
      expiryDate, 
      creator,
      // Nuevos campos legales en metadata
      legalId: content.id, 
      storageProtocol: blockchainEvidence.storageProtocol
  });

  let transferResult = null;
  if (recipientAccountId) {
    transferResult = await hederaService.transferCredentialToStudent(tokenId, mintResult.serialNumber, recipientAccountId);
  }

  // 4. Guardar en Base de Datos
  const finalIpfsURI = mintResult?.ipfs?.uri ? mintResult.ipfs.uri : (blockchainEvidence.storage ? blockchainEvidence.storage.persistentUrl : null);
  
  const credRecord = { 
    tokenId, 
    serialNumber: mintResult.serialNumber, 
    universityId: token?.universityId || null, 
    studentAccountId: recipientAccountId || null, 
    uniqueHash, 
    ipfsURI: finalIpfsURI, 
    ipfsMetadataCid: mintResult?.ipfs?.cid || null, 
    ipfsPdfCid: blockchainEvidence.storage ? blockchainEvidence.storage.cid : null, 
    storageDeal: blockchainEvidence.storage || null,
    storageProtocol: blockchainEvidence.storageProtocol || 'IPFS',
    externalProofs: { 
      xrpTxHash: blockchainEvidence.xrpKey, 
      algoTxId: blockchainEvidence.algorandKey 
    } 
  };
  
  if (useMem()) { mem.credentials.push({ ...credRecord, createdAt: new Date() }); } else { await Credential.create(credRecord); }
  
  if (!useMem() && req.universityId) {
    const metricsService = require('../../services/metricsService');
    metricsService.increment('issuance_count', 1, { universityId: req.universityId });
  }

  res.status(201).json({
    success: true,
    message: 'Credential issued successfully with Legal & Forensic Evidence',
    data: {
      serialNumber: mintResult.serialNumber,
      tokenId,
      studentId: content.id, 
      ipfs: { 
          uri: finalIpfsURI, 
          cid: blockchainEvidence.storage ? blockchainEvidence.storage.cid : null,
          storageProtocol: blockchainEvidence.storageProtocol
      },
      evidence: {
          hederaTransactionId: mintResult.transactionId || 'available-on-ledger',
          algorandTxId: blockchainEvidence.algorandKey,
          filecoinStatus: blockchainEvidence.storage ? 'PERSISTENT' : 'STANDARD'
      },
      transferStatus: transferResult ? 'TRANSFERRED' : 'MINTED_TO_TREASURY'
    }
  });
}));

router.post('/issue-unified', verifyApiKey, apiRateLimit, associationGuard, [
  body('tokenId').notEmpty().trim(),
  body('uniqueHash').notEmpty().trim(),
  body('ipfsURI').notEmpty().trim(),
  body('studentName').notEmpty().trim(),
  body('degree').notEmpty().trim(),
  body('recipientAccountId').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { tokenId, uniqueHash, ipfsURI, studentName, degree, recipientAccountId } = req.body;
  let token = useMem() ? mem.tokens.find(t => t.tokenId === tokenId) : await Token.findOne({ tokenId });
  if (!token && String(process.env.ALLOW_V1_TOKEN_AUTO_CREATE).toLowerCase() === 'true') {
    const name = `AcademicChain - ${degree || 'Credential'}`;
    const created = await hederaService.createAcademicToken({ tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}`, tokenMemo: `Auto-created for unified issuance`, treasuryAccountId: process.env.HEDERA_ACCOUNT_ID || null });
    if (useMem()) { token = { tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` }; mem.tokens.push(token); }
    else { token = await Token.create({ tokenId: created.tokenId, tokenName: name, tokenSymbol: `AC-${(degree||'EDU').slice(0,4).toUpperCase()}` }); }
  }
  const universityLabel = token?.tokenName || 'AcademicChain';
  let xrpPre2 = null;
  let algoPre2 = null;
  try {
    await xrpService.connect();
    xrpPre2 = await xrpService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: 'pending', timestamp: new Date().toISOString() });
  } catch {}
  try {
    await algorandService.connect();
    algoPre2 = await algorandService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: 'pending', timestamp: new Date().toISOString() });
  } catch {}
  const mintResult = await hederaService.mintAcademicCredential(tokenId, { uniqueHash, ipfsURI, degree, studentName, university: universityLabel, recipientAccountId, xrpTxHash: xrpPre2?.xrpTxHash, algoTxId: algoPre2?.algoTxId });
  let transferResult = null;
  if (recipientAccountId) {
    transferResult = await hederaService.transferCredentialToStudent(tokenId, mintResult.serialNumber, recipientAccountId);
  }
  const rec = { tokenId, serialNumber: mintResult.serialNumber, universityId: token?.universityId || null, studentAccountId: recipientAccountId || null, uniqueHash, ipfsURI, externalProofs: { xrpTxHash: xrpPre2?.xrpTxHash, algoTxId: algoPre2?.algoTxId } };
  if (useMem()) { mem.credentials.push({ ...rec, createdAt: new Date() }); } else { await Credential.create(rec); }

  const primary = decideChainFromRequest(req);
  const order = primary === 'xrpl' ? ['xrpl','algorand'] : (primary === 'algorand' ? ['algorand','xrpl'] : ['xrpl','algorand']);
  let primaryAnchor = null; let secondaryAnchor = null;
  for (const chain of order) {
    try {
      if (chain === 'xrpl') { await xrpService.connect(); primaryAnchor = await xrpService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
      if (chain === 'algorand') { await algorandService.connect(); primaryAnchor = await algorandService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
      break;
    } catch {}
  }
  try {
    if (!primaryAnchor || order[0] !== 'xrpl') { await xrpService.connect(); secondaryAnchor = await xrpService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
  } catch {}
  try {
    if (!primaryAnchor || order[0] !== 'algorand') { await algorandService.connect(); secondaryAnchor = await algorandService.anchor({ certificateHash: uniqueHash, hederaTokenId: tokenId, serialNumber: mintResult.serialNumber, timestamp: new Date().toISOString() }); }
  } catch {}

  res.status(201).json({ success: true, message: 'Credential issued (unified)', data: {
    mint: mintResult,
    transfer: transferResult,
    anchors: {
      pre: { xrp: xrpPre2?.xrpTxHash || null, algorand: algoPre2?.algoTxId || null },
      primary: primaryAnchor ? { chain: order[0], id: primaryAnchor.xrpTxHash || primaryAnchor.algoTxId || null, status: primaryAnchor.status || 'completed' } : null,
      secondary: secondaryAnchor ? { id: secondaryAnchor.xrpTxHash || secondaryAnchor.algoTxId || null, status: secondaryAnchor.status || 'completed' } : null,
    }
  } });
}));

function sha256Hex(input) {
  return crypto.createHash('sha256').update(Buffer.isBuffer(input) ? input : String(input), 'utf8').digest('hex');
}
function buildMerkleLevels(hashes) {
  const levels = [];
  let current = hashes.map(h => String(h).toLowerCase());
  levels.push(current);
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = (i + 1 < current.length) ? current[i + 1] : current[i];
      const combined = Buffer.concat([Buffer.from(left, 'hex'), Buffer.from(right, 'hex')]);
      next.push(sha256Hex(combined));
    }
    levels.push(next);
    current = next;
  }
  return levels;
}
function computeProof(levels, index) {
  const path = [];
  let idx = index;
  for (let level = 0; level < levels.length - 1; level++) {
    const nodes = levels[level];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : (idx + 1 < nodes.length ? idx + 1 : idx);
    path.push({ position: isRight ? 'left' : 'right', hash: nodes[siblingIdx] });
    idx = Math.floor(idx / 2);
  }
  return path;
}
function verifyProof(hash, proof, expectedRoot) {
  let acc = String(hash).trim().toLowerCase();
  for (const step of (Array.isArray(proof) ? proof : [])) {
    const sib = String(step.hash || '').trim().toLowerCase();
    const left = step.position === 'left';
    const combined = left
      ? Buffer.concat([Buffer.from(sib, 'hex'), Buffer.from(acc, 'hex')])
      : Buffer.concat([Buffer.from(acc, 'hex'), Buffer.from(sib, 'hex')]);
    acc = sha256Hex(combined);
  }
  return acc === String(expectedRoot || '').trim().toLowerCase();
}
async function fetchLatestMerkleRootFromTopic(topicId) {
  const base = process.env.HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';
  const url = `${base}/api/v1/topics/${topicId}/messages?limit=50&order=desc`;
  const resp = await axios.get(url, { timeout: 15000 });
  const messages = resp.data?.messages || [];
  for (const m of messages) {
    try {
      const b = Buffer.from(m.message || '', 'base64');
      const s = b.toString('utf8');
      const j = JSON.parse(s);
      if (j && j.type === 'MERKLE_ROOT' && typeof j.merkleRoot === 'string') {
        return { merkleRoot: j.merkleRoot, sequenceNumber: m.sequence_number, consensusTimestamp: m.consensus_timestamp };
      }
    } catch {}
  }
  return null;
}

router.post('/merkle/batch', verifyApiKey, apiRateLimit, [
  body('hashes').optional().isArray(),
  body('documents').optional().isArray(),
], validate, asyncHandler(async (req, res) => {
  const docs = Array.isArray(req.body.documents) ? req.body.documents : [];
  const hashesInput = Array.isArray(req.body.hashes) ? req.body.hashes : [];
  const leaves = (hashesInput.length ? hashesInput : docs.map(d => d.hash || sha256Hex(String(d.cid || d.content || ''))))
    .map(h => String(h).trim().toLowerCase());
  if (!leaves.length) return res.status(400).json({ success: false, message: 'No hashes provided' });
  const levels = buildMerkleLevels(leaves);
  const root = levels[levels.length - 1][0];
  await hederaService.connect();
  const hSubmit = await hederaService.submitMerkleRoot(root, { count: leaves.length, issuer: 'AcademicChain' });
  let xrpl = null, algo = null;
  try { await xrpService.connect(); xrpl = await xrpService.anchor({ certificateHash: root, title: 'MERKLE_ROOT', issuer: 'AcademicChain', hederaTopicId: hSubmit.topicId, hederaSequence: hSubmit.sequence, timestamp: new Date().toISOString() }); } catch {}
  try { await algorandService.connect(); algo = await algorandService.anchor({ certificateHash: root, title: 'MERKLE_ROOT', issuer: 'AcademicChain', timestamp: new Date().toISOString() }); } catch {}
  const proofs = leaves.map((_, i) => computeProof(levels, i));
  const baseClient = String(process.env.CLIENT_URL || '').trim();
  const verificationLinks = leaves.map((leaf, i) => {
    const proofJson = JSON.stringify(proofs[i]);
    const b64 = Buffer.from(proofJson, 'utf8').toString('base64url');
    const params = new URLSearchParams();
    params.set('hash', leaf);
    params.set('proof_b64', b64);
    params.set('hederaTopicId', hSubmit.topicId);
    if (xrpl?.xrpTxHash) params.set('xrplTx', xrpl.xrpTxHash);
    if (algo?.algoTxId) params.set('algoTx', algo.algoTxId);
    const path = `/verificar?${params.toString()}`;
    const url = baseClient ? `${baseClient}${path}` : path;
    return { hash: leaf, proof_b64: b64, url };
  });
  res.status(201).json({
    success: true,
    message: 'Merkle batch anchored',
    data: {
      merkleRoot: root,
      count: leaves.length,
      hedera: { topicId: hSubmit.topicId, sequence: hSubmit.sequence, txId: hSubmit.transactionId, explorer: `https://hashscan.io/${process.env.HEDERA_NETWORK || 'testnet'}/transaction/${hSubmit.transactionId}` },
      xrpl: xrpl?.xrpTxHash ? { txHash: xrpl.xrpTxHash, explorer: `https://${(process.env.XRPL_NETWORK||'testnet').includes('main')?'livenet':'testnet'}.xrpl.org/transactions/${xrpl.xrpTxHash}` } : null,
      algorand: algo?.algoTxId ? { txId: algo.algoTxId, explorer: `https://testnet.explorer.perawallet.app/tx/${algo.algoTxId}/` } : null,
      proofs,
      verificationLinks,
    }
  });
}));

router.post('/merkle/verify', verifyApiKey, apiRateLimit, [
  body('hash').notEmpty().isString(),
  body('proof').isArray(),
  body('merkleRoot').optional().isString(),
  body('hederaTopicId').optional().isString(),
], validate, asyncHandler(async (req, res) => {
  const { hash, proof, merkleRoot, hederaTopicId } = req.body;
  let root = String(merkleRoot || '').trim();
  let fromTopic = null;
  if (!root && hederaTopicId) {
    try {
      const latest = await fetchLatestMerkleRootFromTopic(hederaTopicId);
      if (latest && latest.merkleRoot) {
        root = latest.merkleRoot;
        fromTopic = { sequenceNumber: latest.sequenceNumber, consensusTimestamp: latest.consensusTimestamp };
      }
    } catch {}
  }
  if (!root) return res.status(400).json({ success: false, message: 'merkleRoot or hederaTopicId required' });
  const ok = verifyProof(hash, proof, root);
  let xrpl = null, algo = null;
  try { await xrpService.connect(); xrpl = await xrpService.getByHash(root); } catch {}
  try { await algorandService.connect(); algo = await algorandService.getByHash(root); } catch {}
  res.status(200).json({
    success: ok,
    data: {
      merkleRoot: root,
      verified: ok,
      hederaTopic: fromTopic || null,
      anchors: {
        xrpl: xrpl?.xrpTxHash || null,
        algorand: algo?.algoTxId || null,
      }
    }
  });
}));

module.exports = router;
/**
 * @swagger
 * /api/v1/credentials/issue:
 *   post:
 *     summary: Emite una credencial con API Key
 *     tags: [Credentials]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *               uniqueHash:
 *                 type: string
 *               ipfsURI:
 *                 type: string
 *               studentName:
 *                 type: string
 *               degree:
 *                 type: string
 *               recipientAccountId:
 *                 type: string
*     responses:
*       201:
*         description: Credencial emitida
*         content:
*           application/json:
*             examples:
*               created:
*                 value:
*                   success: true
*                   message: "Credential issued"
*                   data:
*                     mint:
*                       serialNumber: "1"
*                       transactionId: "0.0.abc-def"
*                     transfer:
*                       transactionId: "0.0.xyz"
 */
