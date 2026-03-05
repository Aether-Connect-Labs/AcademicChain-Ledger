export const getApiBaseUrl = () => {
  // Auto-detect local environment first to avoid misconfiguration
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('Using local proxy for API');
      return ''; // Use relative path to trigger Vite proxy
    }
  }

  const env = import.meta.env || {};
  const apiUrl = env.VITE_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      return url.toString().replace(/\/+$/, "");
    } catch (e) {
      return apiUrl;
    }
  }
  
  // Auto-detect local environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
  }

  // Default to empty string to allow relative paths or let the caller handle missing config
  console.warn('API_BASE_URL not configured. Using relative path.');
  return '';
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
    } catch { }
    throw new Error(errorMessage);
  }
  return res.json();
};
