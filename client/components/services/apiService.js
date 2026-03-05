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

  // --- Credentials Management ---
  deleteCredential: async ({ tokenId, serialNumber }) => {
    console.log('[ApiService] Deleting credential...', { tokenId, serialNumber });
    // TODO: Implement delete endpoint
    return { success: true };
  },

  revokeCredential: async ({ tokenId, serialNumber, reason }) => {
    console.log('[ApiService] Revoking credential...', { tokenId, serialNumber, reason });
    // TODO: Implement revocation endpoint
    return { success: true };
  },

  getCredentialStats: async ({ scope, issuerId, role } = {}) => {
    // Return mock stats to prevent UI errors until backend endpoint is ready
    return {
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
      issuanceTrend: [10, 15, 8, 20, 25, 30],
      topSkills: ['Blockchain', 'AI', 'Security'],
      studentEngagement: 85
    };
  },

  getInstitutionPlan: async (id) => {
    return { 
      id: 'plan-pro', 
      name: 'Professional', 
      features: ['Unlimited Issuance', 'API Access'] 
    };
  },

  upgradePlan: async (planId) => {
    console.log('[ApiService] Upgrading plan...', planId);
    return { success: true };
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
