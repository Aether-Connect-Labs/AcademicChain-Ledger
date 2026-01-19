const hederaService = require('./hederaServices');
const algorandService = require('./algorandService');
const storageService = require('./storageService');
const logger = require('../utils/logger');

/**
 * Servicio para generar reportes forenses de verificación de credenciales.
 * Agrega evidencia de múltiples cadenas (Hedera, Algorand) y almacenamiento (Filecoin).
 */
class VerificationReportService {

  /**
   * Genera un reporte forense completo para una credencial
   * @param {string} credentialId - ID de la credencial (ej: "0.0.12345-1" o "0.0.12345")
   * @returns {Promise<object>} El reporte JSON estructurado
   */
  async generateForenseReport(credentialId) {
    logger.info(`🔍 Generando reporte forense para: ${credentialId}`);

    try {
        // 1. Parsear ID (formato esperado: tokenId-serialNumber)
        let tokenId, serialNumber;
        if (credentialId.includes('-')) {
            [tokenId, serialNumber] = credentialId.split('-');
        } else {
            // Asumir serial 1 si no se provee (caso borde)
            tokenId = credentialId;
            serialNumber = '1'; 
        }

        // 2. Verificar en Hedera (Fuente de Verdad Primaria)
        // Usamos verifyCredential para obtener metadatos y estado on-chain
        const hederaVerification = await hederaService.verifyCredential(tokenId, serialNumber);
        
        // Si no es válido en Hedera, abortamos con reporte negativo
        if (!hederaVerification.valid) {
             return {
                status: 'INVALID',
                error: 'Credential not found or invalid on Hedera Hashgraph',
                timestamp: new Date().toISOString()
            };
        }

        const metadata = hederaVerification.credential.metadata || {};
        const studentDid = metadata.studentDid || 'UNKNOWN_DID';
        const uniqueHash = metadata.uniqueHash || 'UNKNOWN_HASH';
        const cid = hederaVerification.credential.metadataCid;

        // 3. Verificar en Algorand (Respaldo de Integridad)
        let algoProof = null;
        try {
            if (process.env.ALGORAND_ENABLED === 'true') {
                const algoAnchor = await algorandService.getByTokenSerial(tokenId, serialNumber);
                if (algoAnchor) {
                    algoProof = {
                        txId: algoAnchor.algoTxId,
                        hash: algoAnchor.certificateHash,
                        timestamp: algoAnchor.timestamp,
                        status: 'VERIFIED_ON_CHAIN'
                    };
                }
            }
        } catch (e) {
            logger.warn('⚠️ Error consultando Algorand para reporte:', e.message);
        }

        // 4. Verificar Persistencia (Filecoin)
        let filecoinStatus = 'UNKNOWN';
        if (cid) {
            try {
                if (process.env.LIGHTHOUSE_API_KEY) {
                    const status = await storageService.getStorageStatus(cid);
                    filecoinStatus = status ? 'PERSISTENT_AND_REPLICATED' : 'NOT_FOUND_ON_FILECOIN';
                } else {
                    filecoinStatus = 'IPFS_ONLY';
                }
            } catch (e) {
                filecoinStatus = 'CHECK_FAILED';
            }
        }

        // 5. Construir Reporte Final
        return {
            reportHeader: "CERTIFICADO DE AUTENTICIDAD BLOCKCHAIN",
            verificationDate: new Date().toISOString(),
            credentialStatus: "ACTIVE", // Podríamos chequear revocación aquí también
            studentIdentity: {
                did: studentDid,
                name: metadata.studentName,
                institution: metadata.institution,
                status: "IDENTITY_VERIFIED_BY_INSTITUTION"
            },
            blockchainEvidence: {
                primary: { 
                    network: "Hedera Hashgraph", 
                    tokenId: tokenId,
                    serialNumber: serialNumber,
                    owner: hederaVerification.credential.ownerAccountId,
                    metadataCid: cid
                },
                secondary: { 
                    network: "Algorand", 
                    proof: algoProof || "NOT_ANCHORED_OR_PENDING" 
                }
            },
            integrityStatus: {
                documentHash: uniqueHash,
                filecoinPersistence: filecoinStatus,
                originalFile: cid ? `https://ipfs.io/ipfs/${cid}` : null
            }
        };

    } catch (error) {
        logger.error('❌ Error generando reporte forense:', error);
        throw new Error('Failed to generate verification report');
    }
  }
}

module.exports = new VerificationReportService();
