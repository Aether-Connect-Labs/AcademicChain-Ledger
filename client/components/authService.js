// client/services/authService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
        if (!res.ok) throw new Error('Login inválido');
        const data = await res.json();
        return data;
      }
    } catch {}

    const forInstitution = userType === 'institution';
    if (forInstitution) {
      if (email && email.includes('@') && password === 'password') {
        const user = {
          id: 'admin-123',
          name: 'Administrador Principal',
          email,
          role: 'admin',
          permissions: ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'],
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

    if (token && token.startsWith('mock-jwt-token-for-admin')) {
      return mockApiCall({ id: 'admin-123', name: 'Administrador Principal', email: 'admin@academicchain.com', role: 'admin', permissions: ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'] });
    }
    if (token && token.startsWith('mock-jwt-token-for-student')) {
      return mockApiCall({ id: 'student-456', name: 'Usuario Free', email: 'demo@gmail.com', role: 'student', permissions: [] });
    }
    return mockApiCall(null, true, 'Token inválido o expirado.');
  },
};