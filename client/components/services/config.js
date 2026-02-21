export const getApiBaseUrl = () => {
  const env = import.meta.env || {};
  // Prioritize N8N Webhook URL
  const n8nUrl = env.VITE_N8N_WEBHOOK_URL;
  if (n8nUrl) {
    // If it's a full URL like .../webhook/submit-document, get the base .../webhook/
    try {
      const url = new URL(n8nUrl);
      // Remove the last segment if it looks like a specific action
      if (url.pathname.endsWith('/submit-document')) {
        return n8nUrl.replace('/submit-document', '');
      }
      return n8nUrl;
    } catch (e) {
      return n8nUrl;
    }
  }
  return 'https://acl-academicchain.aether-connect-labs.workers.dev';
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
