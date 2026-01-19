const express = require('express');
const { verifyApiKey } = require('../middleware/auth');
const { logApiUsage } = require('../middleware/apiKeyAuth');
const veramoSecureService = require('../services/veramoSecure');
const logger = require('../utils/logger');

const router = express.Router();

// Aplicar logging a todas las rutas de identidad
router.use(logApiUsage);

// Endpoint protegido para crear un nuevo DID
router.post('/dids', verifyApiKey, async (req, res) => {
  try {
    const { alias, provider = 'did:web' } = req.body;
    const apiKey = req.headers['x-api-key'];
    
    if (!alias) {
      return res.status(400).json({ 
        error: 'ALIAS_REQUIRED', 
        message: 'El campo alias es requerido para crear un DID' 
      });
    }

    const result = await veramoSecureService.createDIDSecure(apiKey, {
      alias,
      provider
    });

    logger.info(`DID creado exitosamente: ${result.did} para alias: ${alias}`);
    
    res.status(201).json({
      success: true,
      data: {
        did: result.did,
        alias: result.alias,
        provider: result.provider,
        document: result.document
      }
    });
  } catch (error) {
    logger.error('Error al crear DID:', error);
    res.status(500).json({
      error: 'DID_CREATION_FAILED',
      message: 'No se pudo crear el DID',
      details: error.message
    });
  }
});

// Endpoint protegido para resolver un DID existente
router.get('/dids/:did', verifyApiKey, async (req, res) => {
  try {
    const { did } = req.params;
    const apiKey = req.headers['x-api-key'];
    
    if (!did) {
      return res.status(400).json({
        error: 'DID_REQUIRED',
        message: 'El DID es requerido'
      });
    }

    const result = await veramoSecureService.resolveDIDSecure(apiKey, did);

    if (!result) {
      return res.status(404).json({
        error: 'DID_NOT_FOUND',
        message: 'El DID no fue encontrado'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error al resolver DID:', error);
    res.status(500).json({
      error: 'DID_RESOLUTION_FAILED',
      message: 'No se pudo resolver el DID',
      details: error.message
    });
  }
});

// Endpoint protegido para emitir una credencial verificable
router.post('/credentials/issue', verifyApiKey, async (req, res) => {
  try {
    const credentialData = req.body;
    const apiKey = req.headers['x-api-key'];
    
    // Validación básica de los datos requeridos
    if (!credentialData.credentialSubject || !credentialData.type) {
      return res.status(400).json({
        error: 'INVALID_CREDENTIAL_DATA',
        message: 'Los campos credentialSubject y type son requeridos'
      });
    }

    const verifiableCredential = await veramoSecureService.issueCredentialSecure(
      apiKey,
      credentialData
    );

    logger.info(`Credencial emitida exitosamente para: ${credentialData.credentialSubject.id || 'sujeto desconocido'}`);
    
    res.status(201).json({
      success: true,
      data: {
        verifiableCredential
      }
    });
  } catch (error) {
    logger.error('Error al emitir credencial:', error);
    res.status(500).json({
      error: 'CREDENTIAL_ISSUANCE_FAILED',
      message: 'No se pudo emitir la credencial',
      details: error.message
    });
  }
});

// Endpoint protegido para verificar una credencial
router.post('/credentials/verify', requireApiKey(['credentials:read', 'admin']), async (req, res) => {
  try {
    const { verifiableCredential } = req.body;
    
    if (!verifiableCredential) {
      return res.status(400).json({
        error: 'CREDENTIAL_REQUIRED',
        message: 'La credencial verificable es requerida'
      });
    }

    const verificationResult = await veramoSecureService.verifyCredentialSecure(
      req.apiKeyInfo.key,
      verifiableCredential
    );

    res.json({
      success: true,
      data: verificationResult
    });
  } catch (error) {
    logger.error('Error al verificar credencial:', error);
    res.status(500).json({
      error: 'CREDENTIAL_VERIFICATION_FAILED',
      message: 'No se pudo verificar la credencial',
      details: error.message
    });
  }
});

// Endpoint protegido para obtener información del agente
router.get('/agent/info', requireApiKey(['agent:read', 'admin']), async (req, res) => {
  try {
    const agentInfo = await veramoSecureService.getAgentInfo(req.apiKeyInfo.key);
    
    res.json({
      success: true,
      data: agentInfo
    });
  } catch (error) {
    logger.error('Error al obtener información del agente:', error);
    res.status(500).json({
      error: 'AGENT_INFO_FAILED',
      message: 'No se pudo obtener información del agente',
      details: error.message
    });
  }
});

module.exports = router;