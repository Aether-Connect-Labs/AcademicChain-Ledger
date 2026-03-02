import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'acl-secret-key-change-me';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
const ACL_AUTH_KEY = process.env.ACL_AUTH_KEY || '';

// Redis Client Setup
const redisClient = createClient({
    url: REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log(`Connected to Redis at ${REDIS_URL}`));

(async () => {
    try {
        console.log(`Attempting to connect to Redis at ${REDIS_URL}...`);
        await redisClient.connect();
    } catch (e) {
        console.warn(`Could not connect to Redis at ${REDIS_URL}, proceeding without cache:`, e.message);
    }
})();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for PDF uploads

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });

    // Support legacy "acl-" tokens from previous implementation
    if (token.startsWith('acl-')) {
        try {
            const decoded = atob(token.replace(/^acl-/, ""));
            const parts = decoded.split("|");
            req.user = { 
                email: parts[0] || "admin@academicchain.com", 
                role: parts[1] || "admin",
                institutionId: "inst-default" // Default institution for legacy
            };
            return next();
        } catch (e) {
            return res.status(403).json({ success: false, message: 'Forbidden: Invalid legacy token' });
        }
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
};

// Rate Limiting Middleware (Redis)
const rateLimit = async (req, res, next) => {
    if (!redisClient.isOpen) return next();
    
    // Use user ID or IP if user is not present (though this middleware is usually after auth)
    const identifier = req.user ? (req.user.institutionId || req.user.id) : req.ip;
    const key = `rate_limit:${identifier}:${req.path}`;
    
    try {
        const current = await redisClient.incr(key);
        if (current === 1) {
            await redisClient.expire(key, 60); // 1 minute window
        }
        
        if (current > 100) { // 100 requests per minute
            return res.status(429).json({ success: false, message: 'Too Many Requests' });
        }
        next();
    } catch (e) {
        console.error('Rate limit error', e);
        next();
    }
};

// Helper: Log Metrics
async function logMetrics(source, saved_cost) {
    try {
        // Fire and forget
        axios.post('http://localhost:5678/webhook/metrics/log', {
            source, 
            saved_cost, 
            timestamp: new Date()
        }).catch(e => console.log('Error en métricas (silencioso):', e.message));
    } catch (e) {
        // Ignore
    }
}

// Helper: Call n8n
async function callN8n(path, payload = {}, method = 'POST') {
    const url = `${N8N_WEBHOOK_URL.replace(/\/$/, '')}/${path.replace(/^\/+/, "")}`;
    const headers = { "Content-Type": "application/json" };
    if (ACL_AUTH_KEY) headers["X-ACL-AUTH-KEY"] = ACL_AUTH_KEY;
    
    try {
        const config = {
            method,
            url,
            headers
        };
        if (method === 'POST' || method === 'PUT') {
            config.data = payload;
        }
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('n8n error:', error.message);
        throw new Error("n8n error: " + (error.response?.data ? JSON.stringify(error.response.data) : error.message));
    }
}

// Helper: Hash
async function sha256HexFromBase64(base64) {
    const buffer = Buffer.from(base64, 'base64');
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
}

// Routes

// Health Check
app.get('/', (req, res) => {
    res.send('AcademicChain Backend Running');
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role, name } = req.body;
    
    // In a real app, verify password here. For now, mocking as per previous implementation.
    // The previous implementation used base64 encoding of email|role.
    // We will upgrade to JWT but keep backward compatibility if needed, or just use JWT.
    
    // In a real app, you would fetch institutionId from DB based on user
    const institutionId = "inst-" + (Math.floor(Math.random() * 1000) + 1);

    const user = { 
        id: "user-" + (email || "admin"), 
        name: name || "Admin AcademicChain", 
        email: email || "admin@academicchain.com", 
        role: role || "admin",
        institutionId: institutionId 
    };

    // Create JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, user });
});

// Auth Me
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = { 
        id: "user-" + req.user.email, 
        name: req.user.name || "Admin AcademicChain", 
        email: req.user.email, 
        role: req.user.role,
        institutionId: req.user.institutionId
    };
    res.json({ success: true, data: user });
});

// Support Chat Proxy
app.post('/api/academic-chain-support', async (req, res) => {
    try {
        const response = await callN8n('academic-chain-support', req.body);
        res.json(response);
    } catch (error) {
        console.error('Support chat error:', error.message);
        // Fallback response if n8n is down
        res.json({ 
            output: "Lo siento, el sistema de soporte automatizado no está disponible en este momento. Por favor contacta a soporte@academicchain.com." 
        });
    }
});

// Landing Page Form Submission
app.post('/api/', async (req, res) => {
    try {
        console.log('Received landing page submission:', req.body);
        // Forward to n8n if needed, or just mock success
        // await callN8n('submit-document', req.body);
        
        // Mock success for now to fix "Failed to fetch"
        res.json({ 
            success: true, 
            message: "Solicitud recibida correctamente. Procesando en AcademicChain..." 
        });
    } catch (error) {
        console.error('Landing submission error:', error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Issue Triple (Credential Issuance)
app.post('/api/creators/issue', async (req, res) => {
    try {
        console.log('Creator issuance request:', req.body);
        // Mock success
        await new Promise(r => setTimeout(r, 1000));
        res.json({
            success: true,
            data: {
                id: crypto.randomUUID(),
                txId: '0.0.creator-mock-' + Date.now(),
                status: 'issued',
                ...req.body
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/creators/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Creador Demo',
            did: 'did:hedera:testnet:z6Mkp...',
            brand: 'Academia Digital',
            apiKey: 'key_test_123'
        }
    });
});

app.get('/api/creators/credentials', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

app.post('/api/issue-triple', authenticateToken, rateLimit, async (req, res) => {
    try {
        const body = req.body;
        const studentName = body.studentName || "Alumno Demo";
        const institutionName = body.institutionName || "Universidad Demo";
        const issueDate = body.issueDate || new Date().toISOString().slice(0, 10);
        const pdfBase64 = body.pdfBase64 || null;
        const ipfsFromClient = body.ipfsURI || null;

        let uniqueHashHex = body.uniqueHash || null;

        if (!uniqueHashHex) {
            if (!pdfBase64) {
                return res.status(400).json({ error: "Envia pdfBase64 o uniqueHash en el body" });
            }
            uniqueHashHex = await sha256HexFromBase64(pdfBase64);
        }
        if (!uniqueHashHex.startsWith("0x")) uniqueHashHex = "0x" + uniqueHashHex;

        // Check Cache first
        const cacheKey = `credential:${uniqueHashHex}`;
        if (redisClient.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log('Serving from cache');
                // Metrics: Redis hit saves cost
                logMetrics('Redis', 0.05); // Assume $0.05 per credential generation
                return res.json(JSON.parse(cached));
            }
        }

        const n8nPayload = {
            documentHash: uniqueHashHex,
            studentName,
            institutionName,
            plan: "triple",
            pdfBase64,
            ipfsURI: ipfsFromClient
        };

        let n8nJson;
        try {
            n8nJson = await callN8n("multichain-orchestrator", n8nPayload);
        } catch (e) {
            console.warn("n8n call failed, using mock data for demo", e.message);
            n8nJson = {
                success: true,
                proofs: {
                    hederaTxId: "0.0.mock-hedera-" + Date.now(),
                    ipfsURI: ipfsFromClient || "ipfs://QmMockHash",
                    xrpTxHash: "mock-xrp-hash",
                    algoTxId: "mock-algo-id"
                }
            };
        }

        const proofs = n8nJson.proofs || n8nJson.data || {};
        const ipfsURI = proofs.ipfs || proofs.ipfsURI || n8nJson.ipfsURI || ipfsFromClient || "";
        const hashXRP = proofs.xrpTxHash || proofs.xrp || "";
        const hashAlgo = proofs.algoTxId || proofs.algo || "";

        const responseBody = {
            success: true,
            uniqueHash: uniqueHashHex,
            ipfsURI,
            studentName,
            institutionName,
            issueDate,
            proofs: {
                hederaStatus: proofs.hederaStatus || proofs.hedera || null,
                hederaTxId: proofs.hederaTxId || null,
                xrpTxHash: hashXRP || null,
                algoTxId: hashAlgo || null
            },
            n8nRaw: n8nJson
        };

        // Cache result
        if (redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(responseBody), { EX: 3600 }); // Cache for 1 hour
        }

        res.json(responseBody);

    } catch (error) {
        console.error('Error in issue-triple:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy to n8n for statistics
app.get('/api/universities/statistics', authenticateToken, async (req, res) => {
    try {
        // We can cache statistics too
        const cacheKey = 'stats:universities';
        if (redisClient.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                // Metrics: Redis hit saves cost
                logMetrics('Redis', 0.01);
                return res.json(JSON.parse(cached));
            }
        }

        const n8nResponse = await callN8n(
            "stats-credentials" + (req.url.split('?')[1] ? '?' + req.url.split('?')[1] : ''), 
            {}, 
            'GET'
        );
        
        if (redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(n8nResponse), { EX: 300 }); // Cache for 5 mins
        }

        res.json(n8nResponse);
    } catch (error) {
        // Fallback mock
        const fallback = { success: true, revoked: 0, deleted: 0, verified: 0, pending: 0, simulated: true };
        res.json(fallback);
    }
});

// Mocks
app.get('/api/universities/credentials', authenticateToken, (req, res) => {
    const mockCredentials = {
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 10 }
    };
    res.json(mockCredentials);
});

app.post('/api/universities/create-token', authenticateToken, (req, res) => {
    res.json({ success: true, message: "Token created (mock)" });
});

app.post('/api/universities/execute-issuance', authenticateToken, (req, res) => {
    res.json({ success: true, message: "Issuance executed (mock)" });
});

app.get('/api/antigravity/test', (req, res) => {
    res.status(403).json({ error: "Access Denied by Antigravity Firewall", reason: "Suspicious Activity Detected" });
});

app.post('/api/v1/ai/validate-batch', authenticateToken, (req, res) => {
    const batch = Array.isArray(req.body.batch) ? req.body.batch : [];
    const total = batch.length;
    const issues = [];
    res.json({ success: true, data: { total, issues } });
});

// Support Chat Proxy (Direct Route)
app.post('/academic-chain-support', async (req, res) => {
    try {
        const response = await callN8n('academic-chain-support', req.body);
        res.json(response);
    } catch (error) {
        console.error('Support chat error:', error.message);
        // Fallback response if n8n is down
        res.json({ 
            output: "Lo siento, el sistema de soporte automatizado no está disponible en este momento. Por favor contacta a soporte@academicchain.com." 
        });
    }
});

// Generic Proxy to n8n (if needed, mimicking previous behavior)
app.use('/webhook/*', async (req, res) => {
    try {
        const path = req.params[0];
        const result = await callN8n(path, req.body);
        res.json(result);
    } catch (error) {
        res.status(502).json({ error: "Upstream Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
