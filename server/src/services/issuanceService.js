const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const hederaService = require('./hederaServices');
const xrpService = require('./xrpService');
const algorandService = require('./algorandService');
const storageService = require('./storageService');
const { generateUniqueAcademicId } = require('../utils/identityUtils');
const logger = require('../utils/logger');

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
            `Persistence Protocol: ${evidence.storageProtocol || 'IPFS+Filecoin'}`,
            `Timestamp: ${new Date().toISOString()}`
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

        // Código QR Placeholder (opcional, si quisieras generarlo real necesitarías una lib extra)
        // firstPage.drawRectangle({ x: width - 80, y: 30, width: 40, height: 40, color: rgb(0.9, 0.9, 0.9) });

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
            storageProtocol: process.env.LIGHTHOUSE_API_KEY ? 'IPFS+Filecoin' : 'IPFS'
        });
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
    } else if (finalBuffer) {
      // Intentamos subir a Filecoin (Lighthouse)
      try {
        if (process.env.LIGHTHOUSE_API_KEY) {
            // Usamos un buffer con la evidencia ya estampada
            storageResult = await storageService.uploadAcademicDocument(Buffer.from(finalBuffer), `${studentId}.pdf`);
        } else {
            // Fallback a IPFS simple si no hay key de Filecoin
            const ipfs = require('./ipfsService');
            const pdf = await ipfs.pinFile(Buffer.from(finalBuffer), `${studentId}.pdf`, 'application/pdf');
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

    return {
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
  }
}

module.exports = new IssuanceService();
