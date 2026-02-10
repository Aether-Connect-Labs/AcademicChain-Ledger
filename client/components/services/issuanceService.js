import { API_BASE_URL, getAuthHeaders, handleResponse } from './config';
import { create as createIpfsClient } from 'ipfs-http-client';
import n8nService from './n8nService';

export const issuanceService = {
  createCredentialTemplate: (data) => {
    return {
      id: crypto.randomUUID(),
      type: data.credentialType,
      subject: {
        name: data.studentName,
        studentId: data.studentId,
        degree: data.degree,
        major: data.major,
      },
      issuer: data.institution,
      issueDate: data.issueDate,
      expirationDate: data.expirationDate,
      metadata: data.metadata || {},
    };
  },

  getTokens: async () => {
    try {
      // Try to fetch from n8n first
      const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-b0be.onrender.com/webhook/submit-document';
      const n8nUrl = baseUrl.replace('submit-document', 'get-tokens');

      if (n8nUrl) {
        const res = await fetch(n8nUrl, { 
          headers: { 
            'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key',
            ...getAuthHeaders()
          } 
        });
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch tokens from n8n, falling back to mock', e);
    }

    // Mock temporal para que la UI funcione sin el backend de Node viejo
    return {
      success: true,
      data: {
        tokens: [
          { tokenId: '0.0.123456', tokenName: 'Diploma Oficial Ingeniería' },
          { tokenId: '0.0.654321', tokenName: 'Certificado de Honor' }
        ],
        university: 'Universidad Demo n8n'
      }
    };
  },

  getCredentials: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/universities/credentials${q ? `?${q}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getStatistics: async () => {
    const res = await fetch(`${API_BASE_URL}/api/universities/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createToken: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/universities/create-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  validateBatchWithAi: async (batch) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/validate-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ batch }),
    });
    return handleResponse(res);
  },

  prepareIssuance: async (data) => {
    console.warn('prepareIssuance está obsoleto. Usar n8nService.submitDocument');
    throw new Error('Función obsoleta. Use n8n directo.');
  },

  executeIssuance: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/universities/execute-issuance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  issueBulkCredentials: async (payload) => {
    try {
       return await n8nService.submitBatch(payload);
    } catch (e) {
      console.warn('n8n Batch Submit Failed', e);
    }

    console.log('Simulating Bulk Issuance via n8n (Placeholder)...');
    // Mock response
    return {
      success: true,
      jobId: 'job-' + Date.now(),
      message: 'Batch received by n8n (Simulated)'
    };
  },

  getBatchStatus: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/api/universities/batch-status/${jobId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Creator Methods
  getCreatorProfile: async () => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/creators/profile`, { headers: getAuthHeaders() });
        if (res.ok) return handleResponse(res);
      }
    } catch { }
    // Mock
    return {
      success: true,
      data: {
        name: 'Creador Demo',
        did: 'did:hedera:testnet:z6Mkp...',
        brand: 'Academia Digital',
        apiKey: 'key_test_123'
      }
    };
  },

  getCreatorCredentials: async () => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/creators/credentials`, { headers: getAuthHeaders() });
        if (res.ok) return handleResponse(res);
      }
    } catch { }
    // Mock
    return {
      success: true,
      data: [
        { id: 1, type: 'Curso', title: 'Curso React Avanzado', student: 'Juan Pérez', issuedAt: new Date().toISOString() },
        { id: 2, type: 'Mentoria', title: 'Mentoria 1:1', student: 'Ana Gómez', issuedAt: new Date(Date.now() - 86400000).toISOString() }
      ]
    };
  },

  issueCreatorCredential: async (data) => {
    try {
      // Try n8n endpoint first
      const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-b0be.onrender.com/webhook/submit-document';
      const n8nUrl = baseUrl.replace('submit-document', 'issue-creator-credential');

      if (n8nUrl) {
         const res = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key',
              ...getAuthHeaders()
            },
            body: JSON.stringify(data)
         });
         if (res.ok) return handleResponse(res);
      }

      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/creators/issue`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        if (res.ok) return handleResponse(res);
      }
    } catch { }

    // Mock Simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        txId: '0.0.123456@1700000000.000000000',
        status: 'issued',
        ...data
      }
    };
  },

  verifyCredential: async (tokenId, serialNumber) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/verify/${tokenId}/${serialNumber}`, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },

  uploadToIPFS: async (file) => {
    // 1. Client-side Pinata/IPFS (Since backend is n8n headless)
    const pinataJwt = import.meta.env.VITE_PINATA_JWT || '';
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || '';
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY || '';

    if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pinataMetadata', JSON.stringify({ name: file.name }));
      fd.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const headers = pinataJwt
        ? { Authorization: `Bearer ${pinataJwt}` }
        : { pinata_api_key: pinataApiKey, pinata_secret_api_key: pinataSecretKey };

      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: fd
      });

      if (!res.ok) throw new Error('Pinata upload failed');
      const data = await res.json();
      return `ipfs://${data.IpfsHash}`;
    } else {
      // Fallback to ipfs-http-client
      const endpoint = import.meta.env.VITE_IPFS_ENDPOINT || 'https://ipfs.infura.io:5001/api/v0';
      const projectId = import.meta.env.VITE_IPFS_PROJECT_ID || '';
      const projectSecret = import.meta.env.VITE_IPFS_PROJECT_SECRET || '';
      const authHeader = projectId && projectSecret ? 'Basic ' + btoa(`${projectId}:${projectSecret}`) : undefined;

      const client = createIpfsClient({
        url: endpoint,
        headers: authHeader ? { Authorization: authHeader } : undefined
      });

      const added = await client.add(file);
      return `ipfs://${added.cid.toString()}`;
    }
  },

  fetchBlob: async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  },

  updateCreatorProfile: async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/api/creator/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  generateCreatorApiKey: async () => {
    const res = await fetch(`${API_BASE_URL}/api/creator/api-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};

export default issuanceService;
