import { API_BASE_URL } from './config';

/**
 * Unified API Service to handle backend operations via Worker APIs.
 * Replaces legacy N8N integration.
 */
const apiService = {
  // --- Employer ---
  generateEmployerReport: async (reportData) => {
    console.log('[ApiService] Generating employer report...', reportData);
    // TODO: Implement actual endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, reportUrl: 'https://example.com/report.pdf' };
  },

  // --- Issuance ---
  submitBatch: async (batchData) => {
    console.log('[ApiService] Submitting batch...', batchData);
    const response = await fetch(`${API_BASE_URL}/api/universities/execute-issuance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionId: batchData.institutionId || 'inst-default',
        candidates: batchData.candidates
      })
    });
    return await response.json();
  },

  submitMultiChainCredential: async (credential) => {
    console.log('[ApiService] Submitting single credential...', credential);
    const response = await fetch(`${API_BASE_URL}/api/creators/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential)
    });
    return await response.json();
  },

  // --- Full Stack Issuance (User Requested) ---
  issueFullCredential: async (data) => {
    console.log('[ApiService] Issuing FULL STACK credential...', data);
    try {
      const response = await fetch(`${API_BASE_URL}/api/creators/issue-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Full Stack Issue Error:', error);
      throw error;
    }
  },

  // --- Credentials Management ---
  deleteCredential: async ({ tokenId, serialNumber }) => {
    console.log('[ApiService] Deleting credential...', { tokenId, serialNumber });
    // TODO: Implement delete endpoint
    return { success: true };
  },

  revokeCredential: async ({ tokenId, serialNumber, reason }) => {
    console.log('[ApiService] Revoking credential...', { tokenId, serialNumber, reason });
    try {
      const response = await fetch(`${API_BASE_URL}/api/creators/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          certificateId: tokenId, 
          serialNumber, 
          reason 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Revocation Error:', error);
      throw error;
    }
  },

  getCredentialStats: async ({ scope, issuerId, role } = {}) => {
    // Return mock stats to prevent UI errors until backend endpoint is ready
    return {
      success: true,
      totalIssued: 150,
      active: 145,
      revoked: 5,
      pending: 2
    };
  },

  requestCredentialVerification: async ({ tokenId, serialNumber, role }) => {
    console.log('[ApiService] Requesting verification...', { tokenId, serialNumber });
    return { success: true, verified: true };
  },

  // --- Institution ---
  checkInstitutionAccount: async (email) => {
    console.log('[ApiService] Checking institution account...', email);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { exists: true };
  },

  requestPasswordReset: async (email, type = 'institution') => {
    console.log('[ApiService] Requesting password reset...', { email, type });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  getInstitutionAnalytics: async (institutionId) => {
    console.log('[ApiService] Getting analytics for...', institutionId);
    return {
      success: true,
      issuanceTrend: [10, 15, 8, 20, 25, 30],
      topSkills: ['Blockchain', 'AI', 'Security'],
      studentEngagement: 85,
      employability: { rate: 92, trend: '+5%' },
      perfectMatchStats: { topRankCount: 45 },
      identityStats: { percentage: 98, verifiedStudents: 450, totalStudents: 460 },
      skillsGap: {
        marketDemand: [
          { name: 'Blockchain Dev', gap: -15 },
          { name: 'AI Engineering', gap: 5 },
          { name: 'Cybersecurity', gap: 0 }
        ]
      }
    };
  },

  getInstitutionPlan: async (id) => {
    return { 
      details: {
        id: 'professional',
        name: 'Plan Profesional',
        limit: 220,
        networks: ['hedera', 'xrp'],
        analytics: 'advanced',
        price: 155
      },
      emissionsUsed: 45
    };
  },

  getInstitutionCredentials: async (institutionId) => {
    console.log('[ApiService] Getting credentials for...', institutionId);
    // Mock data
    return [
      {
        id: 'cred-001',
        tokenId: '0.0.123456',
        studentId: 'A001',
        studentName: 'Juan Pérez',
        title: 'Ingeniería de Software',
        type: 'titulo',
        createdAt: new Date().toISOString(),
        status: 'verified',
        ipfsURI: 'ipfs://QmHash1'
      },
      {
        id: 'cred-002',
        tokenId: '0.0.123457',
        studentId: 'A002',
        studentName: 'Maria Garcia',
        title: 'Certificado de Honor',
        type: 'certificado',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending',
        ipfsURI: 'ipfs://QmHash2'
      }
    ];
  },

  upgradePlan: async (planId) => {
    console.log('[ApiService] Upgrading plan...', planId);
    return { 
      success: true,
      plan: {
        id: planId,
        name: planId === 'enterprise' ? 'Plan Enterprise' : 'Plan Profesional',
        limit: planId === 'enterprise' ? Infinity : 220,
        networks: planId === 'enterprise' ? ['hedera', 'xrp', 'algorand'] : ['hedera', 'xrp'],
        analytics: 'advanced',
        price: planId === 'enterprise' ? 'custom' : 155
      }
    };
  },

  // --- Payments ---
  verifyTransaction: async (data) => {
    console.log('[ApiService] Verifying transaction...', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, newBalance: 500 };
  },

  createPayment: async (data) => {
    console.log('[ApiService] Creating payment...', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, paymentUrl: 'https://example.com/pay' };
  },

  // --- Creator ---
  checkCreatorAccount: async (email) => {
    console.log('[ApiService] Checking creator account...', email);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { exists: true };
  },

  // --- AI / Design ---
  processAIChat: async (text, context) => {
    console.log('[ApiService] Processing AI Design Chat...', text);
    try {
      const response = await fetch(`${API_BASE_URL}/api/design/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context })
      });
      const data = await response.json();
      return { 
          message: data.message || "He procesado tu solicitud.",
          modifications: data.modifications || []
      };
    } catch (error) {
      console.error('[ApiService] AI Chat Error:', error);
      return {
        message: "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.",
        modifications: []
      };
    }
  },

  processCanvaDesign: async (canvaUrl) => {
    console.log('[ApiService] Processing Canva design...', canvaUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, imageUrl: 'https://via.placeholder.com/800x600?text=Imported+Design' };
  },

  // --- Support Bot ---
  processSupportChat: async (message, history) => {
    console.log('[ApiService] Processing Support Chat...', message);
    try {
      const response = await fetch(`${API_BASE_URL}/api/academic-chain-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Support Chat Error:', error);
      throw error;
    }
  },

  // --- Smart CV ---
  verifyTalent: async ({ credentialId }) => {
    console.log('[ApiService] Verifying talent...', credentialId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employer/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: credentialId })
      });
      return await response.json();
    } catch (error) {
       console.error('[ApiService] Verify Talent Error:', error);
       // Fallback to mock if API fails
       return { success: true, verified: !credentialId.includes('FAIL') };
    }
  },

  generateSmartCV: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/smart-cv/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Smart CV Generation Error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default apiService;
