// client/pages/LoginPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')

const LoginPage = ({ userType = 'student', mode = 'login' }) => {
  const { isLoading, login, error } = useAuth();
  const location = useLocation();
  const [googleEnabled, setGoogleEnabled] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  

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
  const allowInstitutionRegister = import.meta.env.VITE_ALLOW_INSTITUTION_REGISTER === '1';

  

  const handleGoogle = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || (userType === 'institution' ? '/institution/dashboard' : '/student/portal');
    try { localStorage.setItem('postLoginNext', next); } catch {}
    const url = `${API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}&next=${encodeURIComponent(next)}`;
    window.location.href = url;
  };
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password, userType);
    setSubmitting(false);
    if (ok) {
      const params = new URLSearchParams(location.search);
      const next = params.get('next') || (userType === 'institution' ? '/institution/dashboard' : '/student/portal');
      navigate(next, { replace: true });
    }
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
          {userType === 'institution' && mode === 'register' && allowInstitutionRegister && (
            <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>Registro institucional habilitado</span>
            </div>
          )}
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
            </div>
          )}
          <form onSubmit={handleEmailLogin} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="tu.email@gmail.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••" required />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? 'Ingresando…' : 'Ingresar con correo'}</button>
          </form>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <a href="/demo/institution" className="btn-secondary w-full text-center">Ver Demo Institución</a>
            <a href="/demo/student" className="btn-primary w-full text-center">Ver Demo Alumno</a>
          </div>
          {userType === 'institution' && mode === 'register' && !allowInstitutionRegister ? (
            <div className="text-center text-sm text-gray-600">
              Acceso institucional solo por invitación del administrador.
            </div>
          ) : (
            <div className="text-center text-sm text-gray-600">
              Acceso institucional solo por invitación del administrador.
            </div>
          )}

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
