// client/components/useAuth.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const allowBypass = import.meta.env.DEV || import.meta.env.VITE_ALLOW_ALL_PAGES === '1';

  useEffect(() => {
    const init = async () => {
      try {
        const existingToken = localStorage.getItem('authToken');
        if (existingToken) {
          setToken(existingToken);
          const profile = await authService.getCurrentUser(existingToken);
          setUser(profile);
        } else if (import.meta.env.DEV && localStorage.getItem('previewOwner') === '1') {
          setUser({ id: 'preview-owner', email: 'owner@preview.local', name: 'Owner Preview', role: 'admin' });
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [allowBypass]);

  const isAuthenticated = !!user;

  const setSession = useCallback(async (t) => {
    localStorage.setItem('authToken', t);
    setToken(t);
    const profile = await authService.getCurrentUser(t);
    setUser(profile);
  }, []);

  const login = useCallback(async (email, password, userType = 'student') => {
    setError('');
    try {
      const { user: u, token: t } = await authService.login(email, password, userType);
      localStorage.setItem('authToken', t);
      setToken(t);
      setUser(u || (await authService.getCurrentUser(t)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setError('');
    try {
      const { user: u, token: t } = await authService.register(email, password);
      localStorage.setItem('authToken', t);
      setToken(t);
      setUser(u || (await authService.getCurrentUser(t)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const registerInstitution = useCallback(async (email, password) => {
    setError('');
    try {
      const { user: u, token: t } = await authService.registerInstitution(email, password);
      localStorage.setItem('authToken', t);
      setToken(t);
      setUser(u || (await authService.getCurrentUser(t)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const registerCreator = useCallback(async (email, password) => {
    setError('');
    try {
      const { user: u, token: t } = await authService.registerCreator(email, password);
      localStorage.setItem('authToken', t);
      setToken(t);
      setUser(u || (await authService.getCurrentUser(t)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem('authToken');
    setToken('');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = React.useMemo(
    () => ({ user, token, isAuthenticated, isLoading, error, login, register, registerInstitution, registerCreator, logout, setSession, verifyCode: async (email, code) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return /^\d{6}$/.test(code);
      } catch {
        return false;
      }
    } }),
    [user, token, isAuthenticated, isLoading, error, login, register, registerInstitution, logout, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
