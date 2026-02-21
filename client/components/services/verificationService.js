import { API_BASE_URL, handleResponse } from './config';

export const verificationService = {
  /**
   * Verify a credential using the POST endpoint.
   * This is the primary method for the Credential Verifier component.
   * @param {string} tokenId
   * @param {string} serialNumber
   * @returns {Promise<Object>} Verification result
   */
  verifyCredential: async (tokenId, serialNumber) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/verify-credential`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenId, serialNumber }),
    });
    return handleResponse(res);
  },

  /**
   * Verify ownership of a credential.
   * @param {string} tokenId
   * @param {string} serialNumber
   * @param {string} accountId
   * @returns {Promise<Object>} Verification result including ownership status
   */
  verifyOwnership: async (tokenId, serialNumber, accountId) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/verify-ownership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenId, serialNumber, accountId }),
    });
    return handleResponse(res);
  },

  /**
   * Verify a holder's signature.
   * @param {string} accountId
   * @param {string} message
   * @param {string} signature
   * @returns {Promise<Object>} Verification result
   */
  verifyHolderSignature: async (accountId, message, signature) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/verify-holder-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId, message, signature }),
    });
    return handleResponse(res);
  },

  /**
   * Get public verification status (GET endpoint).
   * Can return HTML or JSON depending on headers, but this service enforces JSON.
   * @param {string} tokenId
   * @param {string} serialNumber
   * @returns {Promise<Object>} Verification result
   */
  getCredentialDetails: async (tokenId, serialNumber) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/verify/${tokenId}/${serialNumber}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  /**
   * Batch verify multiple credentials.
   * @param {Array<{tokenId: string, serialNumber: string}>} credentials
   * @returns {Promise<Object>} Batch verification summary
   */
  batchVerify: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/batch-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentials }),
    });
    return handleResponse(res);
  },

  /**
   * Get the status of the verification service.
   * @returns {Promise<Object>} Service status
   */
  getServiceStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/api/verification/status`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  /**
   * Get credential history/metadata for QR preview.
   * @param {string} tokenId
   * @param {string} serialNumber
   * @returns {Promise<Object>} Credential history
   */
  getCredentialHistory: async (tokenId, serialNumber) => {
    const res = await fetch(`${API_BASE_URL}/api/verification/credential-history/${encodeURIComponent(tokenId)}/${encodeURIComponent(serialNumber)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  getCredentialStatus: async (tokenId, serialNumber) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/credentials/status/${encodeURIComponent(tokenId)}/${encodeURIComponent(serialNumber)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  revokeCredential: async (tokenId, serialNumber, reason, apiKey) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/credentials/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {})
      },
      body: JSON.stringify({ tokenId, serialNumber, reason }),
    });
    return handleResponse(res);
  },
  
  listRevocations: async ({ tokenId, limit = 50, offset = 0, startDate, endDate, reason } = {}) => {
    const params = new URLSearchParams();
    if (tokenId) params.set('tokenId', tokenId);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (reason) params.set('reason', reason);
    const res = await fetch(`${API_BASE_URL}/api/v1/credentials/revocations?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },

  getVerificationUrl: (tokenId, serialNumber) => {
    return `${API_BASE_URL}/api/verification/verify/${encodeURIComponent(tokenId)}/${encodeURIComponent(serialNumber)}`;
  },

  /**
   * Obtiene el reporte forense completo de una credencial.
   * @param {string} credentialId - ID de la credencial (ej: "0.0.12345-1")
   * @returns {Promise<Object>} Reporte forense JSON
   */
  getForensicReport: async (credentialId) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/credentials/verify/${encodeURIComponent(credentialId)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  merkleBatch: async (documentsOrHashes) => {
    const body = Array.isArray(documentsOrHashes?.documents) || Array.isArray(documentsOrHashes?.hashes)
      ? documentsOrHashes
      : { documents: documentsOrHashes || [] };
    const headers = {
      'Content-Type': 'application/json',
    };
    try {
      const apiKey = localStorage.getItem('apiKey') || import.meta.env.VITE_API_KEY;
      if (apiKey) headers['x-api-key'] = apiKey;
    } catch {}
    const res = await fetch(`${API_BASE_URL}/api/v1/credentials/merkle/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  }
};

export default verificationService;
