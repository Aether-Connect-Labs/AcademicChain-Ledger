/**
 * 🛡️ MODULE PROTECTED BY ANTIGRAVITY INTEGRITY PROTOCOL
 * --------------------------------------------------------
 * Created/Modified by: Antigravity (Lead Architect)
 * Purpose: Unified service for legal credential issuance
 * Integrity: Triple Shield (Hedera + XRP + Algorand)
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const crypto = require('crypto');
const hederaService = require('./hederaServices');
const xrpService = require('./xrpService');
const algorandService = require('./algorandService');
const storageService = require('./storageService');
const encryptionService = require('./encryptionService');
const { generateUniqueAcademicId } = require('../utils/identityUtils');
const logger = require('../utils/logger');
const AuditLog = require('../models/AuditLog');
const { User } = require('../models');

/**
 * Servicio unificado para la emisión legal de credenciales.
 * Orquesta Identidad, Blockchain y Almacenamiento Persistente.
 */
class IssuanceService {

    /**
     * Genera el PDF final con la evidencia blockchain incrustada
     * @param {Buffer} originalPdf - El PDF base subido por la universidad
     * @param {object} evidence - Datos de evidencia (Student DID, Hash, etc)
     */
    async stampEvidenceOnPDF(originalPdf, evidence) {
        try {
            const pdfDoc = await PDFDocument.load(originalPdf);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Calculate Hash of Original PDF (before modification)
            const pdfHash = crypto.createHash('sha256').update(originalPdf).digest('hex');

            // 1.5.1 Embed Metadata (W3C/Adobe Style)
            pdfDoc.setTitle(`Academic Credential - ${evidence.studentId}`);
            pdfDoc.setSubject(`Verifiable Credential for ${evidence.studentId}`);

            // Extended Keywords for Offline Verification
            const keywords = [
                'verifiable-credential',
                `hash:${evidence.uniqueHash}`,
                `file-hash:${pdfHash}`,
                `did:${evidence.studentId}`,
                `issuer-did:${evidence.issuerDid || 'did:web:academic-chain'}`,
                'academic-chain',
                'blockchain-verified',
                'w3c-vc-compatible'
            ];
            pdfDoc.setKeywords(keywords);

            pdfDoc.setProducer('AcademicChain Ledger v1.0 (Web3 Issuer)');
            pdfDoc.setCreator('AcademicChain Issuer Node');

            // Add Custom Metadata (via Author/Subject/Keywords abuse or proper XMP if library supports - PDF-Lib has limited XMP)
            // We use the Subject to store a JSON-like string for machine readability if needed, but standard fields are safer.

            // Pie de página legal
            const fontSize = 8;
            const textY = 40;
            const marginX = 50;

            firstPage.drawText('Blockchain Forensic Evidence & Legal Identity', {
                x: marginX,
                y: textY + 15,
                size: 9,
                font: fontBold,
                color: rgb(0, 0.2, 0.6),
            });

            const evidenceText = [
                `Student DID (Legal ID): ${evidence.studentId}`,
                `Document Hash: ${evidence.uniqueHash.substring(0, 32)}...`,
                `Original File Hash: ${pdfHash.substring(0, 16)}...`,
                `Persistence Protocol: ${evidence.storageProtocol || 'IPFS+Filecoin'}`,
                `Timestamp: ${new Date().toISOString()}`,
                `Status: Active (Verifiable via Ledger)`
            ];

            let currentY = textY;
            evidenceText.forEach(line => {
                firstPage.drawText(line, {
                    x: marginX,
                    y: currentY,
                    size: fontSize,
                    font: font,
                    color: rgb(0.3, 0.3, 0.3),
                });
                currentY -= 10;
            });

            // Digital Signature Visual Stamp
            firstPage.drawText('Digitally Signed by AcademicChain', {
                x: width - 180,
                y: 65,
                size: 7,
                font: fontBold,
                color: rgb(0, 0.4, 0),
            });

            // Código QR de Verificación
            try {
                const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/hash/${evidence.uniqueHash}`;
                const qrBuffer = await QRCode.toBuffer(verificationUrl, { margin: 1 });
                const qrImage = await pdfDoc.embedPng(qrBuffer);

                firstPage.drawImage(qrImage, {
                    x: width - 70,
                    y: 25,
                    width: 45,
                    height: 45,
                });

                firstPage.drawText('Verificar', {
                    x: width - 65,
                    y: 18,
                    size: 6,
                    font: font,
                    color: rgb(0.3, 0.3, 0.3),
                });
            } catch (qrErr) {
                logger.warn('No se pudo incrustar el QR en el PDF:', qrErr.message);
            }

            return await pdfDoc.save();
        } catch (e) {
            logger.error('Error estampando evidencia en PDF:', e);
            return originalPdf; // Fallback: retorna el original si falla
        }
    }

    /**
     * Emite una credencial con validez legal y forense
     * @param {object} data - Datos del estudiante y título
     * @param {Buffer} fileBuffer - Archivo PDF del título (opcional, si se genera al vuelo)
     */
    async mintLegalCredential(data, fileBuffer) {
        const { studentName, institution, degree, uniqueHash } = data;

        logger.info(`🎓 Iniciando emisión legal para: ${studentName}`);

        // 1. Generar Identidad Académica Única (Hash de Identidad)
        // Usamos el uniqueHash del título como "salt" para vincular ID al documento específico
        const studentId = generateUniqueAcademicId(studentName, institution, uniqueHash);
        logger.info(`🆔 ID Académico generado: ${studentId}`);

        // 1.5. Estampar Evidencia en el PDF (Si existe)
        let finalBuffer = fileBuffer;
        if (fileBuffer) {
            finalBuffer = await this.stampEvidenceOnPDF(fileBuffer, {
                studentId,
                uniqueHash,
                issuerDid: data.issuerDid,
                storageProtocol: process.env.LIGHTHOUSE_API_KEY ? 'IPFS+Filecoin' : 'IPFS'
            });
        }

        // 1.8. Cifrado Automático (Legal/GDPR)
        // Generamos una llave única para este archivo.
        const fileKey = encryptionService.generateKey();
        let encryptedBuffer = finalBuffer;
        let isEncrypted = false;

        // Solo ciframos si hay contenido (PDF)
        if (finalBuffer) {
            try {
                logger.info(`🔒 Encrypting document for ${studentName} to ensure GDPR compliance.`);
                encryptedBuffer = encryptionService.encryptBuffer(finalBuffer, fileKey);
                isEncrypted = true;
            } catch (encErr) {
                logger.error('Encryption failed, aborting storage to prevent leak:', encErr);
                throw encErr;
            }
        }

        // 2. Almacenamiento Persistente (Filecoin)
        let storageResult = null;

        // Regla de Persistencia: Si ya existe un CID (fuente de verdad), no resubir.
        if (data.existingCid) {
            logger.info(`♻️ Usando CID existente para ${studentName}: ${data.existingCid}`);
            storageResult = {
                cid: data.existingCid,
                protocol: 'IPFS+Filecoin',
                provider: 'Lighthouse (Cached)',
                persistentUrl: `https://gateway.lighthouse.storage/ipfs/${data.existingCid}`
            };
        } else if (encryptedBuffer) {
            // Intentamos subir a Filecoin (Lighthouse)
            try {
                if (process.env.LIGHTHOUSE_API_KEY) {
                    // Usamos un buffer con la evidencia ya estampada Y CIFRADA
                    storageResult = await storageService.uploadAcademicDocument(Buffer.from(encryptedBuffer), `${studentId}.enc.pdf`);
                } else {
                    // Fallback a IPFS simple si no hay key de Filecoin
                    const ipfs = require('./ipfsService');
                    const pdf = await ipfs.pinFile(Buffer.from(encryptedBuffer), `${studentId}.enc.pdf`, 'application/pdf');
                    storageResult = {
                        cid: pdf.IpfsHash,
                        persistentUrl: `https://ipfs.io/ipfs/${pdf.IpfsHash}`,
                        protocol: 'IPFS (Standard)'
                    };
                }
            } catch (err) {
                logger.error('Error en almacenamiento:', err);
                throw new Error('Fallo en el almacenamiento del documento');
            }
        }

        // 3. Anclaje Multi-Cadena (Consenso + Integridad)

        // Hedera (Consenso Principal)
        // Nota: Asumimos que el token ya existe o se crea fuera, aquí nos enfocamos en el minting y evidencia.
        // Para simplificar, retornamos los datos listos para el minting final en el controlador, 
        // o podríamos llamar a hederaService.mintAcademicCredential aquí si tuviéramos el tokenId.

        // Algorand (Respaldo de Integridad)
        let algoProof = null;
        try {
            if (process.env.ALGORAND_ENABLED === 'true') {
                await algorandService.connect();
                algoProof = await algorandService.anchor({
                    certificateHash: uniqueHash,
                    studentId: studentId,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (e) {
            logger.warn('⚠️ Fallo en anclaje Algorand (no crítico):', e.message);
        }

        // XRP (Respaldo opcional)
        let xrpProof = null;
        try {
            if (process.env.XRPL_ENABLED === 'true') {
                await xrpService.connect();
                xrpProof = await xrpService.anchor({
                    certificateHash: uniqueHash,
                    studentId: studentId
                });
            }
        } catch (e) {
            logger.warn('⚠️ Fallo en anclaje XRP (no crítico):', e.message);
        }

        const result = {
            content: {
                student: studentName,
                school: institution,
                degree: degree,
                id: studentId, // Este es el ID legal que va en el diploma
                uniqueHash: uniqueHash
            },
            blockchainEvidence: {
                // hederaKey se llenará tras el minting real
                algorandKey: algoProof ? algoProof.algoTxId : 'PENDING',
                xrpKey: xrpProof ? xrpProof.xrpTxHash : 'PENDING',
                storage: storageResult,
                storageProtocol: storageResult ? storageResult.protocol : 'PENDING'
            }
        };

        // Trigger Automation
        // automationService.triggerEvent('credential_prepared', result).catch(e => logger.error('Automation trigger failed', e));

        // 4. Audit Log (Legal Compliance)
        try {
            if (data.institutionId) {
                await AuditLog.create({
                    institutionId: data.institutionId,
                    action: 'CREDENTIAL_ISSUED',
                    ipAddress: data.ipAddress || 'unknown',
                    documentHash: uniqueHash, // Using uniqueHash as proxy for document hash here, or calculate fresh SHA256 of encrypted buffer
                    cid: storageResult ? storageResult.cid : 'PENDING',
                    timestamp: new Date(),
                    details: {
                        studentId,
                        isEncrypted,
                        storageProtocol: storageResult ? storageResult.protocol : 'PENDING'
                    }
                });
            }
        } catch (auditErr) {
            logger.error('Failed to write AuditLog:', auditErr);
        }

        // Retornamos también info de encriptación para el controlador
        result.encryption = {
            isEncrypted,
            key: fileKey,
            algo: 'aes-256-gcm'
        };

        return result;
    }

    /**
     * Revoca una credencial cambiando su estado y registrándolo en la blockchain
     * @param {string} credentialId - ID de la credencial en BD
     * @param {string} institutionId - ID de la institución que solicita
     * @param {string} reason - Motivo de la revocación
     * @param {string} ipAddress - IP del solicitante para auditoría
     */
    async revokeCredential(credentialId, institutionId, reason, ipAddress) {
        const Credential = require('../models/Credential');

        // 1. Buscar Credencial y Validar Propiedad
        const credential = await Credential.findOne({ _id: credentialId, universityId: institutionId });
        if (!credential) {
            throw new Error('Credential not found or unauthorized access');
        }

        if (credential.status === 'REVOKED' || credential.isRevoked) {
            throw new Error('Credential is already revoked');
        }

        logger.info(`🚫 Revoking credential ${credentialId} for reason: ${reason}`);

        // 2. Actualizar Bitstring Status List en Hedera
        // Enviamos una transacción al Topic de Revocación
        let revocationTx = null;
        try {
            revocationTx = await hederaService.submitRevocationStatus(
                credential.statusListIndex,
                reason,
                credentialId
            );
        } catch (e) {
            logger.error(`Failed to submit revocation to Hedera: ${e.message}`);
        }

        // 2.5. Actualizar Revocación en XRP (Opcional / Redundancia)
        let xrpRevocation = null;
        try {
            if (process.env.XRPL_ENABLED === 'true') {
                await xrpService.connect();
                xrpRevocation = await xrpService.revoke({
                    certificateHash: credential.uniqueHash,
                    hederaTokenId: credential.tokenId,
                    serialNumber: credential.serialNumber,
                    timestamp: new Date(),
                    reason: reason
                });
                logger.info(`✅ Revocation logged on XRP: ${xrpRevocation.xrpTxHash}`);
            }
        } catch (e) {
            logger.warn(`Failed to submit revocation to XRP: ${e.message}`);
        }

        // 3. Actualizar Estado en DB
        credential.status = 'REVOKED';
        credential.isRevoked = true;
        credential.revocationReason = reason;
        credential.revokedAt = new Date();
        if (revocationTx) {
            credential.revocationTxId = revocationTx.transactionId;
            credential.revocationTopicId = revocationTx.topicId;
            credential.revocationSequence = revocationTx.sequenceNumber;
        }

        // Si estaba cifrado, podemos opcionalmente borrar la llave (Derecho al Olvido vs Revocación Administrativa)
        // Para revocación administrativa (fraude), NO borramos la llave, solo marcamos inválido.

        await credential.save();

        // 4. Registrar en AuditLog (SOC2)
        await AuditLog.create({
            institutionId: institutionId,
            action: 'CREDENTIAL_REVOKED',
            ipAddress: ipAddress,
            blockchainTxHash: revocationTx ? revocationTx.transactionId : 'PENDING_RETRY',
            documentHash: credential.uniqueHash,
            cid: credential.ipfsURI ? credential.ipfsURI.replace('ipfs://', '') : 'unknown',
            timestamp: new Date(),
            details: {
                credentialId,
                reason,
                statusListIndex: credential.statusListIndex,
                revocationMethod: 'BitstringStatusList Update',
                xrpRevocationTx: xrpRevocation ? xrpRevocation.xrpTxHash : null
            }
        });

        return {
            success: true,
            revocationTxId: revocationTx ? revocationTx.transactionId : null,
            xrpRevocationTxId: xrpRevocation ? xrpRevocation.xrpTxHash : null,
            revokedAt: credential.revokedAt
        };
    }
}

module.exports = new IssuanceService();
