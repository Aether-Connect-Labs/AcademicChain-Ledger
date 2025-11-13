// client/pages/LoginPage.js
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Corregido
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = ({ userType = 'student' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (userType === 'institution' ? '/admin' : '/dashboard');

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
    const success = await login(email, password, userType);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className={`p-8 bg-gradient-to-br ${currentConfig.gradient} text-white text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">{currentConfig.icon}</span>
          </div>
          <h1 className="text-3xl font-bold">{currentConfig.title}</h1>
        </div>

        <div className="p-8">
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
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="tu@email.com"
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
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex items-center justify-between">
              <a href="#" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-white font-medium bg-gradient-to-r ${currentConfig.gradient} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:scale-105`}
              >
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              ¿No tienes una cuenta?{' '}
              <a href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;