// client/components/useAuth.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const allowBypass = import.meta.env.DEV || import.meta.env.VITE_ALLOW_ALL_PAGES === '1';

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const profile = await authService.getCurrentUser(token);
          setUser(profile);
        } else if (allowBypass && localStorage.getItem('previewOwner') === '1') {
          setUser({ id: 'preview-owner', email: 'owner@preview.local', name: 'Owner Preview', role: 'admin' });
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const isAuthenticated = !!user;

  const setSession = useCallback(async (token) => {
    localStorage.setItem('authToken', token);
    const profile = await authService.getCurrentUser(token);
    setUser(profile);
  }, []);

  const login = useCallback(async (email, password, userType = 'student') => {
    setError('');
    try {
      const { user: u, token } = await authService.login(email, password, userType);
      localStorage.setItem('authToken', token);
      setUser(u || (await authService.getCurrentUser(token)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setError('');
    try {
      const { user: u, token } = await authService.register(email, password);
      localStorage.setItem('authToken', token);
      setUser(u || (await authService.getCurrentUser(token)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const registerInstitution = useCallback(async (email, password) => {
    setError('');
    try {
      const { user: u, token } = await authService.registerInstitution(email, password);
      localStorage.setItem('authToken', token);
      setUser(u || (await authService.getCurrentUser(token)));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = React.useMemo(
    () => ({ user, isAuthenticated, isLoading, error, login, register, registerInstitution, logout, setSession }),
    [user, isAuthenticated, isLoading, error, login, register, registerInstitution, logout, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);