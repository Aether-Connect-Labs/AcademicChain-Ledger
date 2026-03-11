import { API_BASE_URL, handleResponse } from './config';

export const institutionService = {
  getCatalog: async () => {
    const res = await fetch(`${API_BASE_URL}/api/universities/catalog`, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  },
  signDPA: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/universities/sign-dpa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(res);
  },
  getIssuedCredentials: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/universities/credentials`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return handleResponse(res);
  },
  revokeCredential: async (token, id, reason) => {
    const res = await fetch(`${API_BASE_URL}/api/creators/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ certificateId: id, reason })
    });
    return handleResponse(res);
  }
};

export default institutionService;
