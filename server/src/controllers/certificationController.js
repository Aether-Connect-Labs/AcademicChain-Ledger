const { client, arkhiaUrl } = require("../config/hedera");
const mockDb = require("../services/mockDb");
const Student = require("../models/Student");
const { TopicMessageSubmitTransaction } = require("@hashgraph/sdk");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log("DEBUG: certificationController.js LOADED - V2 CHECK");

const logToFile = (message) => {
    const logPath = 'C:\\Users\\Alumno.LAPTOP-72MR2U1M\\AcademicChain-Ledger\\server\\server.log';
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error("Error writing to log file:", e);
    }
};

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/generate-pdf-ipfs";
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || "0.0.4576394";

// 1. Endpoint de Solicitud (Frontend -> Backend -> n8n)
exports.certifyStudent = async (req, res) => {
    logToFile("certifyStudent called - V2 RELOADED");
    console.log("DEBUG: certifyStudent V2 called");
    try {
        const { studentName, studentId, courseName, graduationDate, institutionId } = req.body;

        // Validación Rápida
        if (!studentName || !studentId || !courseName || !institutionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Faltan datos requeridos" 
            });
        }

        // Guardar estado inicial en MockDB (Mantener para compatibilidad)
        mockDb.saveStudent(studentId, {
            studentName,
            courseName,
            institutionId,
            status: "processing",
            requestTimestamp: new Date().toISOString()
        });

        // Guardar en MongoDB
        try {
            await Student.findOneAndUpdate(
                { studentId },
                {
                    studentName,
                    courseName,
                    institutionId,
                    graduationDate,
                    status: "processing",
                    requestTimestamp: new Date()
                },
                { upsert: true, new: true }
            );
            logToFile(`[MongoDB] Estudiante ${studentId} guardado/actualizado.`);
        } catch (dbError) {
            console.error("Error guardando en MongoDB:", dbError);
            logToFile(`[MongoDB] Error: ${dbError.message}`);
            // No bloqueamos el flujo si falla la BD, seguimos con MockDB/Memoria
        }

        // Registro en Hedera Consensus Service (HCS) - Simulado
        let hcsTransactionId = "0.0.123456@1234567890.000000000"; 
        let hcsStatus = "pending";
        
        try {
            if (client && HCS_TOPIC_ID) {
                logToFile(`[HCS] Attempting to submit message to topic: ${HCS_TOPIC_ID}`);
                const message = JSON.stringify({
                    type: "CERTIFICATION_REQUEST",
                    studentId,
                    courseName,
                    institutionId,
                    timestamp: new Date().toISOString(),
                    status: "STATUS_INITIATED"
                });
                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(HCS_TOPIC_ID)
                    .setMessage(message);
                
                logToFile("[HCS] Transaction created, executing...");
                const txResponse = await transaction.execute(client);
                logToFile("[HCS] Transaction executed, getting receipt...");
                const receipt = await txResponse.getReceipt(client);
                
                // Get the Transaction ID for the explorer link
                hcsTransactionId = txResponse.transactionId.toString();
                const sequenceNumber = receipt.topicSequenceNumber.toString();
                
                logToFile(`[HCS] Mensaje enviado al tópico ${HCS_TOPIC_ID}, secuencia: ${sequenceNumber}, TxID: ${hcsTransactionId}`);
                hcsStatus = "verified";
            } else {
                logToFile(`[HCS] Client or Topic ID missing. Client: ${!!client}, TopicID: ${HCS_TOPIC_ID}`);
                hcsStatus = "skipped";
            }
        } catch (hederaError) {
            logToFile(`Error registrando en HCS (continuando sin HCS): ${hederaError.message}`);
            console.error("Error registrando en HCS (continuando sin HCS):", hederaError);
            
            // FALLBACK: Generar un ID de transacción simulado para la demo si falla HCS
            const mockTimestamp = new Date().getTime() / 1000;
            const seconds = Math.floor(mockTimestamp);
            const nanos = Math.floor((mockTimestamp - seconds) * 1000000000);
            hcsTransactionId = `0.0.7174400@${seconds}.${nanos}`;
            hcsStatus = "simulated";
        }

        // Delegación a n8n (Fire-and-Forget)
        const payload = {
            ...req.body,
            hcsTransactionId,
            hcsStatus,
            requestTimestamp: new Date().toISOString(),
            source: "AcademicChain-Backend-NodeJS"
        };

        // Enviar a n8n (o simular si falla/no existe)
        fetch(N8N_WEBHOOK_URL, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload) 
        }).catch(err => {
            console.error("Error conectando con n8n (webhook):", err.message);
            // Opcional: Si n8n falla, podríamos querer simular el éxito para fines de demo
        });

        // SIMULACIÓN DE N8N (Para Demo sin servidor n8n real)
        // Si no hay respuesta de n8n en 5 segundos, auto-completamos
        setTimeout(() => {
            const currentStatus = mockDb.getStudent(studentId);
            if (currentStatus && currentStatus.status === 'processing') {
                console.log(`[SIMULATION] Auto-completando certificación para ${studentId}`);
                mockDb.updateStudentStatus(studentId, 'completed', {
                    ipfsCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", // CID de ejemplo
                    txHash: "0x" + Math.random().toString(16).slice(2)
                });
            }
        }, 5000);

        console.log("DEBUG: Sending response with details:", { hcsTransactionId, hcsStatus, status: "processing" });

        return res.status(200).json({
            success: true,
            message: "Solicitud recibida y en proceso",
            details: { hcsTransactionId, hcsStatus, status: "processing" }
        });

    } catch (error) {
        console.error("Error en certifyStudent:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
};

// 2. Webhook de Retorno (n8n -> Backend)
exports.n8nCallback = async (req, res) => {
    try {
        const { studentId, ipfsCid, status } = req.body;

        if (!studentId || !ipfsCid) {
            return res.status(400).json({ success: false, message: "Faltan datos (studentId, ipfsCid)" });
        }

        console.log(`[Webhook] Recibido callback de n8n para studentId: ${studentId}, CID: ${ipfsCid}`);

        // Actualizar MockDB (Memoria)
        const updatedStudent = mockDb.updateStudentStatus(studentId, "completed", { 
            ipfsCid,
            completedAt: new Date().toISOString()
        });

        // Actualizar MongoDB
        try {
            await Student.findOneAndUpdate(
                { studentId },
                { 
                    status: "completed", 
                    ipfsHash: ipfsCid,
                    updatedAt: new Date()
                },
                { new: true }
            );
            logToFile(`[MongoDB] Estudiante ${studentId} marcado como completado.`);
        } catch (dbError) {
            console.error("Error actualizando MongoDB:", dbError);
            logToFile(`[MongoDB] Error actualizando: ${dbError.message}`);
        }

        if (!updatedStudent) {
            // Si no estaba en MockDB, intentamos verificar si estaba en MongoDB
            // Pero por ahora devolvemos 404 si no estaba en memoria para mantener compatibilidad
            // O mejor, devolvemos éxito si se actualizó en Mongo
            // return res.status(404).json({ success: false, message: "Estudiante no encontrado en memoria" });
        }

        return res.status(200).json({ success: true, message: "Callback procesado correctamente" });

    } catch (error) {
        console.error("Error en n8nCallback:", error);
        return res.status(500).json({ success: false, message: "Error interno en webhook" });
    }
};

// 3. Endpoint de Estado (Frontend Polling -> Backend)
exports.getStudentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Intentar leer de MockDB primero (más rápido)
        let student = mockDb.getStudent(studentId);
        let status = student ? student.status : null;
        let ipfsCid = student ? student.ipfsCid : null;
        let updatedAt = student ? student.updatedAt : null;

        // Si no está en memoria, buscar en MongoDB
        if (!student) {
            try {
                const dbStudent = await Student.findOne({ studentId });
                if (dbStudent) {
                    status = dbStudent.status;
                    ipfsCid = dbStudent.ipfsHash; // Mapeo de nombre de campo
                    updatedAt = dbStudent.updatedAt;
                    // Opcional: Recargar en MockDB para futuras consultas rápidas
                    mockDb.saveStudent(studentId, {
                        studentName: dbStudent.studentName,
                        courseName: dbStudent.courseName,
                        institutionId: dbStudent.institutionId,
                        status: dbStudent.status,
                        ipfsCid: dbStudent.ipfsHash
                    });
                }
            } catch (dbError) {
                console.error("Error leyendo de MongoDB:", dbError);
            }
        }

        if (!status) {
            return res.status(404).json({ success: false, message: "Estudiante no encontrado" });
        }

        return res.status(200).json({
            success: true,
            status: status,
            ipfsCid: ipfsCid || null,
            updatedAt: updatedAt
        });
    } catch (error) {
        console.error("Error obteniendo estado:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
};

exports.getAllStudents = (req, res) => {
    try {
        const students = mockDb.getAllStudents();
        return res.status(200).json({ success: true, count: students.length, students });
    } catch (error) {
        console.error("Error obteniendo estudiantes:", error);
        return res.status(500).json({ success: false, message: "Error interno" });
    }
};

// 5. Endpoint de prueba de conexión Arkhia (Nuevo)
exports.testArkhiaConnection = async (req, res) => {
    logToFile("testArkhiaConnection called");
    console.log("DEBUG: Testing Arkhia connection...");
    
    if (!arkhiaUrl) {
        return res.status(500).json({ 
            success: false, 
            message: "Arkhia URL not configured in hedera.js" 
        });
    }

    try {
        // Consultar nodos de la red Hedera a través de Arkhia
        const response = await axios.get(`${arkhiaUrl}/network/nodes`);
        
        // Consultar Topic si existe
        let topicInfo = null;
        if (HCS_TOPIC_ID) {
            try {
                const topicRes = await axios.get(`${arkhiaUrl}/topics/${HCS_TOPIC_ID}/messages?limit=5`);
                topicInfo = topicRes.data;
            } catch (e) {
                console.warn("Topic check failed (might be empty):", e.message);
                topicInfo = { error: "Topic not found or empty", details: e.message };
            }
        }

        res.json({
            success: true,
            provider: "Arkhia",
            endpoint: arkhiaUrl,
            network_nodes_count: response.data.nodes ? response.data.nodes.length : 0,
            hcs_topic_status: topicInfo
        });
    } catch (error) {
        console.error("Arkhia connection error:", error.message);
        res.status(502).json({
            success: false,
            message: "Error connecting to Arkhia",
            error: error.message
        });
    }
};
