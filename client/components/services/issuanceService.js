import { API_BASE_URL, getAuthHeaders, handleResponse } from './config';
import { create as createIpfsClient } from 'ipfs-http-client';

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
    const res = await fetch(`${API_BASE_URL}/api/universities/tokens`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
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
    const res = await fetch(`${API_BASE_URL}/api/universities/prepare-issuance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
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
    // Use /issue-bulk which supports both Redis queue and direct fallback
    const target = API_BASE_URL ? `${API_BASE_URL}/api/universities/issue-bulk` : '/api/universities/issue-bulk';
    const res = await fetch(target, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await handleResponse(res);
    // Return unified structure, supporting both immediate result and job ID
    return { 
      jobId: json?.data?.jobId || json?.jobId,
      ...json
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
    } catch {}
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
    } catch {}
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
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/creators/issue`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        if (res.ok) return handleResponse(res);
      }
    } catch {}
    
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
