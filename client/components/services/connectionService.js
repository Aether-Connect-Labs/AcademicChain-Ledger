// Servicio de conexión robusta con fallback automático
class ConnectionService {
  static async healthCheck() {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 3000 // 3 segundos de timeout
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Backend no disponible, usando modo demo:', error.message);
      return false;
    }
  }

  static async fetchWithFallback(endpoint, fallbackData) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

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
    try {
      const response = await fetch('/api/blockchain/status', {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        const status = await response.json();
        return status;
      }
      
      return { connected: false, networks: [] };
    } catch (error) {
      return { connected: false, networks: [], error: error.message };
    }
  }

  // Método para emitir credencial (demo o real)
  static async issueCredential(credentialData, isDemo = false) {
    if (isDemo) {
      // Simular emisión exitosa en demo
      return {
        success: true,
        message: 'Credencial emitida en modo demo',
        transactionId: `DEMO-${Date.now()}`,
        credential: {
          ...credentialData,
          id: `demo-${Date.now()}`,
          createdAt: new Date(),
          status: 'issued'
        }
      };
    }

    try {
      const response = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialData),
        timeout: 15000
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`Error en emisión: ${response.status}`);
    } catch (error) {
      console.error('Error emitiendo credencial:', error);
      return {
        success: false,
        message: 'Error al conectar con el servidor',
        error: error.message
      };
    }
  }
}

export default ConnectionService;