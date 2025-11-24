// client/pages/LoginPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001')

const LoginPage = ({ userType = 'student', mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, registerInstitution, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [googleEnabled, setGoogleEnabled] = useState(null);

  const from = location.state?.from?.pathname || (userType === 'institution' ? '/admin' : '/');

  const config = {
    institution: {
      title: 'Acceso para Instituciones',
      icon: '🏫',
      gradient: 'from-blue-600 to-purple-600',
    },
    student: {
      title: 'Portal del Alumno',
      icon: '🎓',
      gradient: 'from-cyan-500 to-blue-500',
    },
  };

  const currentConfig = config[userType] || config.student;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = mode === 'register' 
      ? (userType === 'institution' ? await registerInstitution(email, password) : await register(email, password))
      : await login(email, password, userType);
    if (success) {
      const target = mode === 'register' && userType !== 'institution' ? '/welcome' : from;
      navigate(target, { replace: true });
    }
  };

  const handleGoogle = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const url = `${API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google/enabled`);
        const data = await res.json();
        setGoogleEnabled(Boolean(data.enabled));
      } catch {
        setGoogleEnabled(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className={`p-8 bg-gradient-to-br ${currentConfig.gradient} text-white text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">{currentConfig.icon}</span>
          </div>
          <h1 className="text-3xl font-bold">{mode === 'register' ? 'Comenzar Gratis' : currentConfig.title}</h1>
          {(
            <></>
          )}
          {(mode === 'register' || mode === 'login') && (
            <p className="mt-2 text-white/80">Elige acceso con Google o usa tu correo</p>
          )}
        </div>

        <div className="p-8">
          {(mode === 'register' || mode === 'login') && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading || googleEnabled === false}
                className={`${googleEnabled === false ? 'btn-ghost border border-gray-200 text-gray-400' : 'btn-secondary'} w-full flex items-center justify-center space-x-3 hover-lift shadow-soft disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>🔵</span>
                <span>{googleEnabled === false ? 'Google no disponible' : (mode === 'register' ? 'Continuar con Google' : 'Iniciar con Google')}</span>
              </button>
              {googleEnabled === false && (
                <div className="mt-2 text-xs text-gray-500 text-center">OAuth de Google no está configurado</div>
              )}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-3 text-gray-400 text-sm">o</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-primary"
               placeholder={userType === 'institution' ? 'tu@institucion.edu' : 'tu@gmail.com'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-primary"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            {mode !== 'register' && (
              <div className="flex items-center justify-between">
                <a href="#" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full hover-lift shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (mode === 'register' ? 'Creando...' : 'Iniciando...') : (mode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {mode !== 'register' ? (
              <p>
                ¿No tienes una cuenta?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Regístrate aquí
                </a>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <a href="/students/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Inicia sesión
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;