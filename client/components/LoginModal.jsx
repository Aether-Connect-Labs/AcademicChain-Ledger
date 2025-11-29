import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ open, onClose, userType = 'student' }) => {
  const navigate = useNavigate();
  const allowInstitutionRegister = import.meta.env.VITE_ALLOW_INSTITUTION_REGISTER === '1';
  const [googleEnabled, setGoogleEnabled] = useState(null);

  useEffect(() => {
    if (!open) {
      setGoogleEnabled(null);
    }
  }, [open]);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
    (async () => {
      try {
        if (!API_BASE_URL) {
          setGoogleEnabled(import.meta.env.DEV ? true : false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/auth/google/enabled`);
        const data = await res.json();
        setGoogleEnabled(Boolean(data.enabled));
      } catch {
        setGoogleEnabled(false);
      }
    })();
  }, []);

  const handleGoogle = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || (userType === 'institution' ? '/institution/dashboard' : '/student/portal');
    if (!API_BASE_URL) {
      onClose?.();
      return;
    }
    try { localStorage.setItem('postLoginNext', next); } catch {}
    const url = `${API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}&next=${encodeURIComponent(next)}`;
    window.location.href = url;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-strong w-full max-w-sm sm:max-w-md border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 id="login-modal-title" className="text-xl font-bold">Acceso {userType === 'institution' ? 'Instituciones' : 'Alumnos'}</h3>
              {userType === 'institution' && allowInstitutionRegister && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  Registro habilitado
                </span>
              )}
            </div>
            <button onClick={onClose} className="btn-ghost">✕</button>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleEnabled === false}
              className={`${googleEnabled === false ? 'btn-ghost border border-gray-200 text-gray-400' : 'btn-secondary'} w-full flex items-center justify-center space-x-3 hover-lift shadow-soft disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>🔵</span>
              <span>{googleEnabled === false ? 'Google no disponible' : 'Iniciar con Google'}</span>
            </button>
            {googleEnabled === false && (
              <div className="mt-2 text-xs text-gray-500 text-center">OAuth de Google no está configurado</div>
            )}
          </div>
          <div className="login-options mt-4">
            <button type="button" className="text-link" onClick={() => navigate('/forgot-password')}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
