export const getApiBaseUrl = () => {
  const env = import.meta.env || {};
  const candidates = [
    env.NEXT_PUBLIC_API_URL,
    env.VITE_API_URL,
    env.VITE_SERVER_URL,
    env.VITE_BASE_URL,
    env.REACT_APP_API_URL,
    env.REACT_APP_SERVER_URL,
    env.SERVER_URL,
    env.BASE_URL
  ].filter(Boolean);
  
  const base = candidates[0] || (env.DEV ? 'http://localhost:3001' : '');
  return String(base).replace(/`/g, '').replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

export const OFFICIAL_BILLETERA_MADRE = String((import.meta.env && import.meta.env.VITE_OFFICIAL_ISSUER_ID) || '').trim();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json && json.message) errorMessage = json.message;
      else if (json && json.error) errorMessage = json.error;
    } catch {}
    throw new Error(errorMessage);
  }
  return res.json();
};
