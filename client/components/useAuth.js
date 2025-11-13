// client/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Comprobar si hay una sesión guardada al cargar la app
    const checkLoggedIn = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          // Aquí podrías validar el token contra el backend
          const userData = await authService.getCurrentUser(storedToken);
          setUser(userData);
          setToken(storedToken);
          setIsAuthenticated(true);
        }
      } catch (e) {
        // El token es inválido o expiró
        localStorage.removeItem('authToken');
        console.error('Session check failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password, userType) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: userData, token: authToken } = await authService.login(email, password, userType);
      localStorage.setItem('authToken', authToken);
      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};