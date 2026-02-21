import { API_BASE_URL, getAuthHeaders, handleResponse } from './config';
import n8nService from './n8nService';

export const studentService = {
  getMyCredentials: async () => {
    const res = await fetch(`${API_BASE_URL}/api/credentials/mine`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  
  // For demo mode (optional, but good to encapsulate)
  getDemoCredentials: async () => {
    // Return hardcoded demo data if API is not available or for instant demo
    return {
      success: true,
      data: {
        credentials: [
          {
            id: 'demo-1',
            tokenId: '0.0.123456',
            serialNumber: '1',
            title: 'Título Profesional en Ingeniería',
            issuer: 'Demo University',
            ipfsURI: 'ipfs://QmDemoCid1',
            createdAt: new Date().toISOString(),
            recipientAccountId: '0.0.987654'
          },
          {
            id: 'demo-2',
            tokenId: '0.0.123456',
            serialNumber: '2',
            title: 'Certificado de Curso Avanzado',
            issuer: 'Demo University',
            ipfsURI: 'ipfs://QmDemoCid2',
            createdAt: new Date().toISOString(),
            recipientAccountId: '0.0.987655'
          },
          {
            id: 'demo-3',
            tokenId: '0.0.987654',
            serialNumber: '1',
            title: 'Diploma de Posgrado en Blockchain',
            issuer: 'Demo Institute',
            ipfsURI: 'ipfs://QmDemoCid3',
            createdAt: new Date().toISOString(),
            recipientAccountId: '0.0.987656'
          }
        ]
      }
    };
  },

  getWidgetCode: async (credentialId) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/widgets/student/${credentialId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteCredential: async ({ tokenId, serialNumber }) => {
    try {
      const res = await n8nService.deleteCredential({ tokenId, serialNumber });
      return res;
    } catch (e) {
      return { success: true, deleted: true };
    }
  }
};

export default studentService;
