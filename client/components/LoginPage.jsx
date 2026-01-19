import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const LoginPage = ({ userType = 'student', mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, registerInstitution, registerCreator } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email || !password) {
      setError('Ingresa correo y contraseña');
      setIsSubmitting(false);
      return;
    }

    (async () => {
      try {
        let ok = false;
        if (mode === 'register') {
          if (userType === 'institution') {
            ok = await registerInstitution(email, password);
          } else if (userType === 'creator') {
            ok = await registerCreator(email, password);
          } else {
            ok = await register(email, password);
          }
        } else {
          ok = await login(email, password, userType);
        }
        if (!ok) throw new Error('Credenciales inválidas');
        const params = new URLSearchParams(location.search);
        const nextParam = params.get('next');
        const target = nextParam || (userType === 'institution' ? '/institution/dashboard' : userType === 'creator' ? '/portal-creadores' : userType === 'student' ? '/student/portal' : '/');
        navigate(target, { replace: true });
      } catch (e) {
        setError(e.message || 'Error de inicio de sesión');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:p-4 focus:bg-indigo-600 focus:text-white"
      >
        Ir al contenido principal
      </a>
      <div
        id="main-content"
        className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        role="main"
      >
      <div
        className="max-w-md w-full space-y-8"
        data-testid="login-form-container"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicia sesión
          </h2>
        </div>
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            data-testid="login-error"
          >
            {error}
          </div>
        )}
        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          data-testid="login-form"
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label
                htmlFor="email-address"
                className="sr-only"
              >
                Correo
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-required="true"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              data-testid="login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : (mode === 'register' ? 'Crear cuenta' : 'Entrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default LoginPage;
