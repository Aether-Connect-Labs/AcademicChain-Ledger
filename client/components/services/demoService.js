import { API_BASE_URL, handleResponse } from './config';

export const demoService = {
  scheduleDemo: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getCredentials: async () => {
    const res = await fetch(`${API_BASE_URL}/api/demo/credentials`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  createToken: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/demo/create-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  issueCredential: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/demo/issue-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  pinCredential: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/demo/pin-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export default demoService;
