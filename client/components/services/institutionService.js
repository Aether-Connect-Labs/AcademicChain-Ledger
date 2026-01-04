import { API_BASE_URL, handleResponse } from './config';

export const institutionService = {
  getCatalog: async () => {
    const res = await fetch(`${API_BASE_URL}/api/universities/catalog`, {
      headers: { 'Accept': 'application/json' }
    });
    return handleResponse(res);
  }
};

export default institutionService;
