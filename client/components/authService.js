// client/services/authService.js

// En un proyecto real, esta URL apuntaría a tu backend.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1/auth';

/**
 * Simula una respuesta de la API con un retardo para emular la latencia de red.
 * @param {*} data Los datos a devolver en caso de éxito.
 * @param {boolean} shouldFail Si la promesa debe fallar.
 * @param {string} errorMessage Mensaje de error si la promesa falla.
 * @param {number} delay Retardo en milisegundos.
 * @returns {Promise}
 */
const mockApiCall = (data, shouldFail = false, errorMessage = 'Error de red', delay = 800) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(errorMessage));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

export const authService = {
  /**
   * Inicia sesión de un usuario.
   * @param {string} email
   * @param {string} password
   * @param {string} userType 'institution' o 'student'
   * @returns {Promise<{user: object, token: string}>}
   */
  login: async (email, password, userType) => {
    console.log(`Simulando login para ${userType}: ${email}`);

    // Lógica de simulación:
    if (password === 'password' && email.includes('@')) {
      const isAdmin = userType === 'institution' && email.startsWith('admin');
      
      const user = {
        id: isAdmin ? 'admin-123' : 'student-456',
        name: isAdmin ? 'Administrador Principal' : 'Estudiante de Ejemplo',
        email: email,
        role: isAdmin ? 'admin' : 'student',
        // Los permisos se usarán para la navegación dinámica en el panel de admin
        permissions: isAdmin ? ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'] : [],
      };
      const token = `mock-jwt-token-for-${user.id}-${Date.now()}`;
      
      return mockApiCall({ user, token });
    } else {
      return mockApiCall(null, true, 'Credenciales inválidas. Inténtalo de nuevo.');
    }
  },

  /**
   * Cierra la sesión del usuario.
   */
  logout: () => {
    console.log('Cerrando sesión...');
    // En una implementación real, esto podría invalidar el token en el backend.
    return Promise.resolve();
  },

  /**
   * Obtiene los datos del usuario actual usando un token guardado.
   * @param {string} token
   * @returns {Promise<object>}
   */
  getCurrentUser: async (token) => {
    console.log('Verificando sesión con token...');
    if (token && token.startsWith('mock-jwt-token-for-admin')) {
      return mockApiCall({ id: 'admin-123', name: 'Administrador Principal', email: 'admin@academicchain.com', role: 'admin', permissions: ['view_dashboard', 'bulk_issue', 'view_job_monitor', 'manage_institutions', 'manage_users', 'manage_settings'] });
    } else if (token && token.startsWith('mock-jwt-token-for-student')) {
      return mockApiCall({ id: 'student-456', name: 'Estudiante de Ejemplo', email: 'student@academicchain.com', role: 'student', permissions: [] });
    } else {
      return mockApiCall(null, true, 'Token inválido o expirado.');
    }
  },
};