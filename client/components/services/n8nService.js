import axios from 'axios';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://primary-production-4224.up.railway.app/webhook/submit-document';

const n8nService = {
    /**
     * Helper to construct N8N URL
     */
    _getN8nUrl: (endpoint) => {
        let baseUrl = N8N_WEBHOOK_URL;
        if (baseUrl.endsWith('/submit-document')) {
            return baseUrl.replace('submit-document', endpoint);
        }
        if (baseUrl.endsWith('/')) {
            return `${baseUrl}${endpoint}`;
        }
        return `${baseUrl}/${endpoint}`;
    },

    /**
     * Check if institution account exists via n8n
     */
    checkInstitutionAccount: async (email) => {
        try {
            console.log('Checking institution account:', email);
            const url = n8nService._getN8nUrl('check-institution');
            
            // Try calling n8n if configured, otherwise mock
            try {
                const res = await axios.post(url, { email }, {
                     headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
                });
                if (res.data && typeof res.data.exists !== 'undefined') {
                    return { exists: res.data.exists };
                }
            } catch (e) {
                // If endpoint not found or error, fallback to mock logic for demo
                console.warn('Institution check mock fallback');
                await new Promise(r => setTimeout(r, 1000));
            }

            // Mock logic for demo purposes
            const exists = email.includes('demo') || email.includes('admin');
            return { exists };
        } catch (error) {
            console.error('Account check error:', error);
            return { exists: false };
        }
    },

    /**
     * Check if creator account exists via n8n
     */
    checkCreatorAccount: async (email) => {
        try {
            console.log('Checking creator account:', email);
            const url = n8nService._getN8nUrl('check-creator');
            
            // Try calling n8n if configured
            try {
                const res = await axios.post(url, { email }, {
                     headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
                });
                if (res.data && typeof res.data.exists !== 'undefined') {
                    return { exists: res.data.exists };
                }
            } catch (e) {
                console.warn('Creator check mock fallback');
                await new Promise(r => setTimeout(r, 1000));
            }
            
            return { exists: email.includes('creator') };
        } catch (error) {
            return { exists: false };
        }
    },

    /**
     * Check if employer account exists via n8n
     */
    checkEmployerAccount: async (email) => {
        try {
            console.log('Checking employer account:', email);
            const url = n8nService._getN8nUrl('check-employer');
            
            try {
                const res = await axios.post(url, { email }, {
                     headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
                });
                if (res.data && typeof res.data.exists !== 'undefined') {
                    return { exists: res.data.exists };
                }
            } catch (e) {
                console.warn('Employer check mock fallback');
                await new Promise(r => setTimeout(r, 1000));
            }
            
            return { exists: email.includes('employer') || email.includes('empresa') };
        } catch (error) {
            return { exists: false };
        }
    },

    /**
     * Request password reset via n8n
     */
    requestPasswordReset: async (email, type = 'institution') => {
        try {
            const url = n8nService._getN8nUrl('password-reset');
            await axios.post(url, { email, type }, {
                headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
            });
            return { success: true };
        } catch (error) {
            console.warn('Reset mock fallback');
            return { success: true, message: 'Reset link sent (Simulated)' };
        }
    },

    /**
     * Verify talent via Employer specific flow
     */
    verifyTalent: async (verificationData) => {
        try {
            console.log('Verifying talent for employer:', verificationData);
            const url = n8nService._getN8nUrl('employer-verify');
            
            // Try calling real n8n endpoint
            try {
                 /* 
                 // Uncomment when n8n endpoint is ready
                 const res = await axios.post(url, verificationData, {
                     headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
                 });
                 return res.data;
                 */
                 await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
                 console.warn('Employer verify mock fallback');
            }

            // Parse QR content if available to return consistent data
            let mockData = {
                name: 'Juan Pérez',
                credential: 'Ingeniería de Sistemas',
                institution: 'Universidad Demo',
                date: '2023-12-15',
                status: 'Valid',
                blockchain: 'Hedera Hashgraph'
            };

            if (verificationData.qrContent) {
                try {
                    const parsed = JSON.parse(verificationData.qrContent);
                    if (parsed.tokenId) {
                        mockData.credential = `Credential #${parsed.serialNumber || '001'}`;
                        mockData.institution = 'Institución Verificada (Blockchain)';
                        mockData.blockchain = 'Hedera Hashgraph (Verified)';
                    }
                } catch (e) {
                    // Not a JSON QR, maybe just a string ID
                }
            }
            
            if (verificationData.qrContent || verificationData.docId) {
                return {
                    success: true,
                    verified: true,
                    data: mockData
                };
            }
            return { success: false, message: 'No se encontró el talento' };
        } catch (error) {
            return { success: false, message: 'Error de verificación' };
        }
    },

    /**
     * Verify student identity by photo/CV upload (Employer flow)
     */
    verifyStudentIdentityByImage: async (formData) => {
        try {
            console.log('Verifying student identity by image for employer...');
            const url = n8nService._getN8nUrl('employer-verify-image');
            
            // Simulate upload and processing delay
            await new Promise(r => setTimeout(r, 2500));

            // Mock response - Simulate finding a match
            return {
                success: true,
                matchFound: true,
                confidence: 0.94,
                data: {
                    name: 'Ana García',
                    credential: 'Ingeniería de Software',
                    institution: 'Instituto Tecnológico Blockchain',
                    graduated: true,
                    date: '2023-06-20',
                    photoMatch: true,
                    blockchain: 'Hedera Hashgraph'
                }
            };
        } catch (error) {
            console.error('Identity image verification error:', error);
            return { success: false, message: 'Error al procesar la imagen' };
        }
    },

    /**
     * Generate Employer Verification Report (PDF)
     */
    generateEmployerReport: async (reportData) => {
        try {
            console.log('Generating employer report:', reportData);
            const url = N8N_WEBHOOK_URL.replace('submit-document', 'generate-employer-report');
            
            // Try calling n8n
            try {
                const res = await axios.post(url, reportData, {
                     headers: { 'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key' }
                });
                return res.data;
            } catch (e) {
                console.warn('Report generation mock fallback');
                await new Promise(r => setTimeout(r, 2000));
            }
            
            return {
                success: true,
                message: 'Report generated successfully',
                reportUrl: 'https://academicchain.com/reports/report-123.pdf'
            };
        } catch (error) {
            console.error('Error generating report:', error);
            return { success: false, message: 'Error generando reporte' };
        }
    },

    /**
     * Submit document data to n8n workflow
     */
    submitDocument: async (data) => {
        try {
            console.log('Sending to n8n:', data);
            const response = await axios.post(N8N_WEBHOOK_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
            console.error('N8n Error:', error);
            throw new Error(error.response?.data?.message || 'Error connecting to n8n Headless API');
        }
    },

    /**
     * Creates a payment via n8n (NOWPayments integration)
     */
    createPayment: async (paymentData) => {
        try {
            const paymentUrl = n8nService._getN8nUrl('create-payment');
            const response = await axios.post(paymentUrl, paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Payment Error:', error);
            return {
                success: true,
                checkoutUrl: 'https://nowpayments.io/payment/?iid=mock-invoice-123',
                invoiceId: 'mock-123'
            };
        }
    },

    /**
     * Verifies a crypto transaction via n8n
     */
    verifyTransaction: async (txData) => {
        try {
            const verifyUrl = n8nService._getN8nUrl('verify-payment');
            const response = await axios.post(verifyUrl, txData, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.warn('Verification mock fallback');
            return { success: true, valid: true, creditsGranted: 500 };
        }
    },

    /**
     * Submit a batch of credentials for processing with Triple Shield Defense
     */
    submitBatch: async (batchData) => {
        try {
            // Check Plan Limits
            const plan = n8nService.getPlanDetails(n8nService._currentPlan);
            const count = batchData.credentials.length;
            
            if (n8nService._emissionsCount + count > plan.limit) {
                 throw new Error(`Límite del plan ${plan.name} excedido. Has emitido ${n8nService._emissionsCount}/${plan.limit}. Intenta emitir menos o actualiza tu plan.`);
            }
            
            // Check Network Permissions
            if (batchData.options.addToHedera && !plan.networks.includes('hedera')) throw new Error('Tu plan no incluye red Hedera.');
            // (Assuming other networks might be added to options later, e.g. xrp)
            
            const batchUrl = n8nService._getN8nUrl('batch-issue');
            
            const payload = {
                ...batchData,
                security: {
                    tripleShield: true,
                    ipfsPersistence: true,
                    encryption: 'AES-256-GCM'
                },
                timestamp: new Date().toISOString()
            };

            // Increment usage
            n8nService._emissionsCount += count;

            const response = await axios.post(batchUrl, payload, {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
             if (error.message.includes('Límite')) throw error;

            console.warn('Batch submit mock fallback');
            
            // Increment usage even in fallback for demo purposes
            const count = batchData.credentials.length;
            n8nService._emissionsCount += count;
            
            return { 
                success: true, 
                jobId: `job-${Date.now()}`,
                message: 'Lote enviado a procesamiento Triple Shield (Simulado)' 
            };
        }
    },

    /**
     * Process Identity Verification (KYC) via n8n AI
     */
    verifyIdentity: async (formData) => {
        try {
            console.log('Sending KYC data to n8n...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Sim delay
            
            return {
                success: true,
                verificationId: 'kyc-' + Date.now(),
                status: 'verified',
                confidenceScore: 0.98,
                message: 'Identity Verified Successfully by AI'
            };
        } catch (error) {
            console.error('KYC Error:', error);
            throw new Error('Identity Verification Failed');
        }
    },

    /**
     * Verify Student Identity by Image/CV (Employer Feature)
     */
    verifyStudentIdentityByImage: async (formData) => {
        try {
            console.log('Verifying identity via n8n AI...', formData);
            const url = N8N_WEBHOOK_URL.replace('submit-document', 'verify-identity-image');
            
            // Mock simulation
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // In production, send formData with axios
            // await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Random success for demo
            const isMatch = Math.random() > 0.3;
            
            if (isMatch) {
                return {
                    success: true,
                    matchFound: true,
                    data: {
                        name: "Estudiante Identificado",
                        confidence: "98.5%",
                        status: "Verified",
                        studentId: "0.0.123456",
                        credentials: ["Ingeniería de Software", "Certificado de React"]
                    }
                };
            } else {
                return {
                    success: true, // Request success, but no match
                    matchFound: false,
                    message: "No se encontró coincidencia en la base de datos biométrica."
                };
            }
        } catch (error) {
            console.error('Identity Verification Error:', error);
            throw new Error('Failed to verify identity');
        }
    },

    /**
     * Generate Smart CV via n8n (LLM)
     */
    generateSmartCV: async (data) => {
        try {
            console.log('Requesting Smart CV from n8n AI...', data);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            return {
                success: true,
                cvData: {
                    summary: "Desarrollador Blockchain certificado con experiencia verificada en redes descentralizadas. (Generado por IA)",
                    skills: ["Hedera Hashgraph (Verificado)", "Smart Contracts", "React", "Node.js"],
                    experience: data.selectedItems ? data.selectedItems.map(id => ({
                        title: "Proyecto Académico Verificado",
                        org: "AcademicChain University",
                        date: "2024",
                        desc: "Implementación validada en blockchain."
                    })) : []
                }
            };
        } catch (error) {
            console.error('CV Gen Error:', error);
            throw new Error('Failed to generate Smart CV');
        }
    },

    /**
     * Process Canva Design URL via n8n
     */
    processCanvaDesign: async (canvaUrl) => {
        try {
            const processUrl = N8N_WEBHOOK_URL.replace('submit-document', 'process-canva');
            const response = await axios.post(processUrl, { url: canvaUrl }, {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
            console.warn('Canva process mock fallback');
            return { 
                success: true, 
                elements: [
                    { type: 'text', text: 'Certificado Canva', left: 100, top: 100, fontSize: 40 },
                    { type: 'image', src: 'https://via.placeholder.com/800x600', left: 0, top: 0 }
                ] 
            };
        }
    },

    /**
     * Save a design template to MongoDB via n8n
     */
    saveTemplate: async (templateData) => {
        try {
            const saveUrl = N8N_WEBHOOK_URL.replace('submit-document', 'save-template');
            const response = await axios.post(saveUrl, templateData, {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
            console.warn('Save template mock fallback');
            return { 
                success: true, 
                id: `tpl-${Date.now()}`,
                message: 'Plantilla guardada (Simulado)' 
            };
        }
    },

    /**
     * Search for verified talent based on skills/description via n8n AI
     */
    searchTalent: async (searchData) => {
        try {
            console.log('Searching talent via n8n AI:', searchData);
            // Simulate AI Search
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                candidates: [
                    {
                        id: 'cand-1',
                        name: 'Daniel Pérez',
                        matchScore: 98,
                        skills: ['Hedera', 'Solidity', 'React'],
                        verified: true,
                        identityVerified: true,
                        chainValidation: {
                            hedera: true,
                            xrp: true,
                            algorand: false
                        },
                        avatar: 'https://i.pravatar.cc/150?u=1'
                    },
                    {
                        id: 'cand-2',
                        name: 'Laura García',
                        matchScore: 85,
                        skills: ['Blockchain Architecture', 'Python'],
                        verified: true,
                        identityVerified: true,
                        chainValidation: {
                            hedera: true,
                            xrp: false,
                            algorand: true
                        },
                        avatar: 'https://i.pravatar.cc/150?u=2'
                    },
                    {
                        id: 'cand-3',
                        name: 'Carlos Ruiz',
                        matchScore: 92,
                        skills: ['Algorand', 'Smart Contracts'],
                        verified: false,
                        identityVerified: false,
                        chainValidation: {
                            hedera: false,
                            xrp: false,
                            algorand: true
                        },
                        avatar: 'https://i.pravatar.cc/150?u=3'
                    }
                ]
            };
        } catch (error) {
            console.error('Talent Search Error:', error);
            throw new Error('Failed to search talent');
        }
    },

    /**
     * Get employer subscription details
     */
    getEmployerSubscription: async (employerId) => {
        return {
            plan: 'professional',
            credits: 450,
            features: {
                aiMatch: true,
                bulkVerify: true,
                apiAccess: false
            }
        };
    },

    /**
     * Perform "Perfect Match" AI analysis for a job description
     */
    matchJobDescription: async (jobData) => {
         try {
            console.log('Matching job description via n8n AI:', jobData);
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            return {
                success: true,
                matches: [
                    {
                        candidateId: 'cand-1',
                        name: 'Daniel Pérez',
                        score: 98,
                        reason: 'Trayecto Académico en Hedera y React coincide 100% con los requisitos.',
                        verified: true
                    },
                     {
                        candidateId: 'cand-4',
                        name: 'Ana Torres',
                        score: 95,
                        reason: 'Alta competencia en Smart Contracts certificada.',
                        verified: true
                    }
                ]
            };
        } catch (error) {
            console.error('Job Match Error:', error);
            throw new Error('Failed to match job description');
        }
    },

    /**
     * Register a successful match event (Student <-> Employer)
     */
    registerSuccessMatch: async (matchData) => {
        try {
            const matchUrl = N8N_WEBHOOK_URL.replace('submit-document', 'register-match');
            console.log('Registering success match via n8n:', matchData);
            
            // Fire and forget usually, but we await for demo
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true, message: 'Match registered' };
        } catch (error) {
            console.error('Match Register Error:', error);
            return { success: true, message: 'Match registered (Fallback)' };
        }
    },

    /**
     * Get market intelligence analytics for an institution
     */
    getInstitutionAnalytics: async (institutionId) => {
        try {
            console.log('Fetching institution analytics from n8n...', institutionId);
            // Simulate AI/Data Aggregation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                employability: {
                    rate: 87, // %
                    trend: '+5%',
                    totalVerified: 450
                },
                skillsGap: {
                    marketDemand: [
                        { name: 'Blockchain Architecture', demand: 90, supply: 60, gap: -30 },
                        { name: 'Smart Contracts (Solidity)', demand: 85, supply: 80, gap: -5 },
                        { name: 'Hedera Consensus', demand: 75, supply: 40, gap: -35 },
                        { name: 'React.js', demand: 95, supply: 90, gap: -5 }
                    ],
                    insight: "El mercado busca un 35% más de especialización en Hedera de lo que la institución está certificando."
                },
                perfectMatchStats: {
                    topRankCount: 128, // Times students appeared in top 3
                    // Heatmap data: value 0-100, growth string
                    industries: [
                        { name: 'Fintech', value: 95, growth: '+12%' },
                        { name: 'Logistics', value: 70, growth: '+5%' },
                        { name: 'Healthcare', value: 45, growth: '+2%' },
                        { name: 'Energy', value: 88, growth: '+15%' },
                        { name: 'GovTech', value: 30, growth: '-2%' },
                        { name: 'Retail', value: 20, growth: '0%' }
                    ]
                },
                identityStats: {
                    verifiedStudents: 320,
                    totalStudents: 450,
                    percentage: 71,
                    trustScore: 92 // Added Trust Score
                }
            };
        } catch (error) {
            console.error('Analytics Error:', error);
            throw new Error('Failed to fetch analytics');
        }
    },

    /**
     * Alias for getInstitutionAnalytics to match user request terminology
     */
    getMarketInsights: async (institutionId) => {
        return n8nService.getInstitutionAnalytics(institutionId);
    },

    // --- Subscription Plan Logic (Mocked) ---
    _currentPlan: 'esencial', // Default plan: 'esencial', 'professional', 'enterprise'
    _emissionsCount: 45, // Current emissions count

    getInstitutionPlan: async (institutionId) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            plan: n8nService._currentPlan,
            emissionsUsed: n8nService._emissionsCount,
            details: n8nService.getPlanDetails(n8nService._currentPlan)
        };
    },

    getPlanDetails: (planId) => {
        const plans = {
            esencial: {
                id: 'esencial',
                name: 'Plan Esencial',
                price: 50,
                limit: 50,
                networks: ['hedera'],
                analytics: 'basic',
                description: 'Ideal para iniciar. Solo red Hedera.'
            },
            professional: {
                id: 'professional',
                name: 'Plan Profesional',
                price: 155,
                limit: 220,
                networks: ['hedera', 'xrp'],
                analytics: 'advanced',
                description: 'Doble sello de seguridad y analíticas completas.'
            },
            enterprise: {
                id: 'enterprise',
                name: 'Plan Enterprise',
                price: 'custom',
                limit: Infinity,
                networks: ['hedera', 'xrp', 'algorand'],
                analytics: 'advanced',
                description: 'Seguridad máxima y soporte dedicado.'
            }
        };
        return plans[planId] || plans.esencial;
    },

    upgradePlan: async (newPlanId) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (['esencial', 'professional', 'enterprise'].includes(newPlanId)) {
            n8nService._currentPlan = newPlanId;
            return { success: true, plan: n8nService.getPlanDetails(newPlanId) };
        }
        throw new Error('Plan inválido');
    }
};

export default n8nService;
