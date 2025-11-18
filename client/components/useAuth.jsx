// client/components/useAuth.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// En un proyecto real, esto estaría en un archivo separado (ej. `api/auth.js`)
import { useNavigate } from 'react-router-dom';

// 1. Crear el Contexto de Autenticación
const AuthContext = createContext(null);

// 2. Crear el Proveedor (AuthProvider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simula la verificación de una sesión existente (ej. con un token)
    // En una app real, aquí harías una llamada a tu backend
    const checkSession = async () => {
      // const loggedInUser = await api.getProfile();
      // if (loggedInUser) setUser(loggedInUser);
      // Por ahora, asumimos que no hay sesión al iniciar.
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const isAuthenticated = !!user;

  // Función de Login
  const login = useCallback(async (email, password) => {
    // Simula una llamada a la API
    console.log('Iniciando sesión con:', email);
    // En una app real: const userData = await api.login(email, password);
    // Simulamos una respuesta exitosa con datos de usuario.
    const userData = { id: '1', email, role: 'admin' }; // Cambia 'admin' por 'student' para probar los roles.
    setUser(userData);
    navigate('/dashboard'); // Redirige al dashboard después del login
  }, [navigate]);

  // Función de Logout
  const logout = useCallback(() => {
    // Simula el cierre de sesión
    // En una app real: await api.logout();
    setUser(null);
    navigate('/login'); // Redirige al login después del logout
  }, [navigate]);

  // El valor que se pasa al Provider.
  // Usamos useMemo para evitar re-renders innecesarios.
  const value = React.useMemo(
    () => ({ user, isAuthenticated, isLoading, login, logout }),
    [user, isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Crear el Hook personalizado (useAuth)
export const useAuth = () => useContext(AuthContext);