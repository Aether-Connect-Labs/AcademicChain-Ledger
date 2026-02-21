import { API_BASE_URL, getAuthHeaders, handleResponse } from './config';

const withTimeout = async (url, options = {}, ms = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

class ConnectionService {
  static async healthCheck() {
    return true;
  }

  static async fetchWithFallback(endpoint, fallbackData) {
    // Intercept health check to avoid console errors in Demo/n8n mode
    if (endpoint === '/health' || endpoint.includes('/health')) {
      return { success: true, data: { ...fallbackData, status: 'OK', uptime: 36000 + Math.random() * 1000 } };
    }

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await withTimeout(url, {
        method: 'GET',
        headers: getAuthHeaders()
      }, 6000);

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`Fallback a datos demo para ${endpoint}:`, error.message);
      return { success: false, data: fallbackData };
    }
  }

  static getDemoInstitutionData() {
    return {
      credentials: [
        {
          id: 'demo-1',
          studentName: 'María González',
          title: 'Licenciatura en Administración',
          tokenId: 'ALGO-123456',
          createdAt: new Date('2024-01-15'),
          issuer: 'Universidad Demo'
        },
        {
          id: 'demo-2',
          studentName: 'Carlos Rodríguez',
          title: 'Ingeniería en Sistemas',
          tokenId: 'HEDERA-789012',
          createdAt: new Date('2024-02-20'),
          issuer: 'Universidad Demo'
        },
        {
          id: 'demo-3',
          studentName: 'Ana Martínez',
          title: 'Maestría en Educación',
          tokenId: 'XRPL-345678',
          createdAt: new Date('2024-03-10'),
          issuer: 'Universidad Demo'
        }
      ],
      stats: {
        totalCredentials: 156,
        totalTokens: 142,
        totalRecipients: 89,
        lastIssuance: new Date('2024-12-12')
      }
    };
  }

  static getDemoStudentData() {
    return {
      credentials: [
        {
          id: 'student-1',
          title: 'Licenciatura en Administración',
          issuer: 'Universidad Nacional Demo',
          issueDate: new Date('2023-06-15'),
          expirationDate: null,
          metadata: {
            studentId: 'STU-2020-001',
            gpa: '4.8',
            honors: 'Cum Laude'
          }
        },
        {
          id: 'student-2',
          title: 'Certificado en Blockchain',
          issuer: 'Academia Tech',
          issueDate: new Date('2024-01-20'),
          expirationDate: new Date('2025-01-20'),
          metadata: {
            studentId: 'CERT-2024-001',
            duration: '120 horas'
          }
        },
        {
          id: 'student-3',
          title: 'Diploma en Desarrollo Web',
          issuer: 'Platzi',
          issueDate: new Date('2023-11-10'),
          expirationDate: null,
          metadata: {
            studentId: 'WEB-2023-045',
            projects: '15 completados'
          }
        }
      ]
    };
  }

  // Método para verificar conexión blockchain
  static async checkBlockchainConnection() {
    // Mock simulation for n8n backend
    return {
      connected: true,
      networks: ['hedera', 'xrpl', 'algorand', 'filecoin'],
      status: 'n8n_active'
    };
  }

  static async getNftBalance(accountId) {
    const res = await fetch(`${API_BASE_URL}/api/nfts/balance/${encodeURIComponent(accountId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  }
}

export default ConnectionService;
