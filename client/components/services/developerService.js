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
  }
};

export default developerService;
