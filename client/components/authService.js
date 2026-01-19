import { API_BASE_URL, getAuthHeaders, handleResponse } from './services/config';

const mockApiCall = (data, shouldFail = false, errorMessage = 'Error de red', delay = 600) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(errorMessage));
      else resolve(data);
    }, delay);
  });
};

const isGmail = (email) => typeof email === 'string' && email.toLowerCase().endsWith('@gmail.com');
const isValidPassword = (password) => typeof password === 'string' && password.length >= 6;

export const authService = {
  loginWithGoogle: async () => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/google/mock`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      }
    } catch {}
    const user = {
      id: 'student-google',
      name: 'Usuario Google',
      email: 'demo@gmail.com',
      role: 'student',
      permissions: [],
    };
    const token = `mock-jwt-token-for-student-${Date.now()}`;
    return mockApiCall({ user, token });
  },
  login: async (email, password, userType) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, userType })
        });
        if (!res.ok) {
          // En desarrollo, intenta login de propietario para institución
          if (userType === 'institution') {
            const preview = await fetch(`${API_BASE_URL}/api/auth/preview-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            if (preview.ok) {
              const data = await preview.json();
              return data;
            }
          }
          throw new Error('Login inválido');
        }
        const data = await res.json();
        return data;
      }
    } catch {}

    const forInstitution = userType === 'institution';
    const forCreator = userType === 'creator'; // Detectar tipo creador

    if (forCreator) {
       // Mock login para creador
       const user = {
         id: `creator-${crypto.randomUUID()}`,
         name: 'Creador Demo',
         email,
         role: 'CREATOR',
         brand: 'Mi Marca Personal',
         permissions: ['issue_credentials', 'view_dashboard']
       };
       const token = `mock-jwt-token-for-creator-${Date.now()}`;
       return mockApiCall({ user, token });
    }

    if (forInstitution) {
      const allowInstitutionMock = (import.meta.env.DEV || import.meta.env.VITE_ALLOW_INSTITUTION_LOGIN === '1');
      if (allowInstitutionMock) {
        const user = {
          id: `university-${crypto.randomUUID()}`,
          name: 'Administrador Institución',
          email,
          role: 'university',
          universityName: 'Institución Demo',
          permissions: ['issue_credentials', 'verify_credential']
        };
        const token = `mock-jwt-token-for-admin-${Date.now()}`;
        return mockApiCall({ user, token });
      }
      return mockApiCall(null, true, 'Credenciales inválidas para institución.');
    }

    if (!isGmail(email)) {
      return mockApiCall(null, true, 'Para comenzar gratis usa un correo Gmail.');
    }
    if (!isValidPassword(password)) {
      return mockApiCall(null, true, 'La contraseña debe tener 6 o más caracteres.');
    }

    const user = {
      id: 'student-456',
      name: 'Usuario Free',
      email,
      role: 'student',
      permissions: [],
    };
    const token = `mock-jwt-token-for-student-${Date.now()}`;
    return mockApiCall({ user, token });
  },

  register: async (email, password) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Registro inválido');
        const data = await res.json();
        return data;
      }
    } catch {}

    if (!isGmail(email)) {
      return mockApiCall(null, true, 'Regístrate con un correo @gmail.com');
    }
    if (!isValidPassword(password)) {
      return mockApiCall(null, true, 'La contraseña debe tener 6 o más caracteres.');
    }
    const user = {
      id: `student-${crypto.randomUUID()}`,
      name: 'Usuario Free',
      email,
      role: 'student',
      permissions: [],
    };
    const token = `mock-jwt-token-for-student-${Date.now()}`;
    return mockApiCall({ user, token });
  },

  registerInstitution: async (email, password) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/institutions/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Registro inválido');
        const data = await res.json();
        return data;
      }
    } catch {}

    if (!email || !email.includes('@')) {
      return mockApiCall(null, true, 'Usa un correo válido institucional.');
    }
    if (!isValidPassword(password)) {
      return mockApiCall(null, true, 'La contraseña debe tener 6 o más caracteres.');
    }
    const user = {
      id: `admin-${crypto.randomUUID()}`,
      name: 'Administrador Institución',
      email,
      role: 'admin',
      permissions: ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'],
    };
    const token = `mock-jwt-token-for-admin-${Date.now()}`;
    return mockApiCall({ user, token });
  },

  registerCreator: async (email, password) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/creators/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Registro inválido');
        const data = await res.json();
        return data;
      }
    } catch {}

    if (!isValidPassword(password)) {
      return mockApiCall(null, true, 'La contraseña debe tener 6 o más caracteres.');
    }
    const user = {
      id: `creator-${crypto.randomUUID()}`,
      name: 'Creador Demo',
      email,
      role: 'CREATOR',
      brand: 'Mi Marca Personal',
      permissions: ['issue_credentials', 'view_dashboard']
    };
    const token = `mock-jwt-token-for-creator-${Date.now()}`;
    return mockApiCall({ user, token });
  },

  logout: () => Promise.resolve(),

  getCurrentUser: async (token) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Sesión inválida');
        const data = await res.json();
        return data?.data || data;
      }
    } catch {}

    try {
      const isOwner = (() => { try { return localStorage.getItem('previewOwner') === '1'; } catch { return false; } })();
      if (isOwner) {
        return mockApiCall({ id: 'admin-preview', name: 'Propietario', email: 'owner@preview.local', role: 'admin', permissions: ['view_dashboard','bulk_issue','view_job_monitor','manage_institutions','manage_users','manage_settings'] });
      }
    } catch {}

    if (token && token.startsWith('mock-jwt-token-for-admin')) {
      return mockApiCall({ id: 'admin-123', name: 'Administrador Principal', email: 'admin@academicchain.com', role: 'admin', permissions: ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'] });
    }
    if (token && token.startsWith('mock-jwt-token-for-creator')) {
      return mockApiCall({ id: 'creator-123', name: 'Creador Demo', email: 'creator@demo.com', role: 'CREATOR', brand: 'Academia Digital', permissions: ['issue_credentials', 'view_dashboard'] });
    }
    if (token && token.startsWith('mock-jwt-token-for-student')) {
      return mockApiCall({ id: 'student-456', name: 'Usuario Free', email: 'demo@gmail.com', role: 'student', permissions: [] });
    }
    return mockApiCall(null, true, 'Token inválido o expirado.');
  },
  previewLogin: async (email, password) => {
    if (!API_BASE_URL) {
      return mockApiCall(null, true, 'API no disponible');
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/preview-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    return res.json();
  },
  requestLoginCode: async (email, userType = 'student') => {
    if (!email || !email.includes('@')) {
      throw new Error('Ingresa un correo válido');
    }
    if (!API_BASE_URL) {
      throw new Error('Servicio de correo no disponible');
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/request-login-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userType })
    });
    if (!res.ok) {
      return mockApiCall({ success: true, sent: true });
    }
    return res.json();
  },
  verifyLoginCode: async (email, code, userType = 'student') => {
    if (!email || !email.includes('@')) {
      throw new Error('Ingresa un correo válido');
    }
    if (!/^[0-9]{6}$/.test(code)) {
      throw new Error('Código inválido');
    }
    if (!API_BASE_URL) {
      throw new Error('Verificación no disponible');
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-login-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, userType })
    });
    if (!res.ok) {
      return mockApiCall({ success: true, verified: true });
    }
    return res.json();
  },
  requestPasswordReset: async (email) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('No se pudo solicitar recuperación');
        return res.json();
      }
    } catch {}
    if (!email || !email.includes('@')) {
      return mockApiCall(null, true, 'Ingresa un correo válido');
    }
    return mockApiCall({ ok: true });
  },
  updateProfile: async (data) => {
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(res);
      }
    } catch (e) {
      console.warn('Update profile failed', e);
      throw e;
    }
    return mockApiCall({ ...data, success: true });
  }
};
