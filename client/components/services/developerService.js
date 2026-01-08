import { API_BASE_URL, handleResponse } from './config';

export const developerService = {
  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  verifyEmail: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  issueApiKey: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/api-keys/issue`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({})
    });
    return handleResponse(res);
  },

  listApiKeys: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/api-keys`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });
    return handleResponse(res);
  },

  revokeApiKey: async (token, apiKey) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/api-keys/revoke`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ apiKey })
    });
    return handleResponse(res);
  },

  rotateApiKey: async (token, apiKey) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/api-keys/rotate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ apiKey })
    });
    return handleResponse(res);
  },

  getRateLimitStatus: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/rate-limit/status`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });
    return handleResponse(res);
  },

  getUsageAnalytics: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/analytics/usage`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });
    return handleResponse(res);
  },

  certifyStandard: async (apiKey, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/certify/standard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  certifyDual: async (apiKey, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/certify/dual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  certifyTriple: async (apiKey, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/certify/triple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};

export default developerService;
