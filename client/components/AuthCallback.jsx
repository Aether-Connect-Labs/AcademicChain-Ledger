import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && setSession) {
      setSession(token).then(() => {
        navigate('/welcome', { replace: true });
      }).catch(() => {
        navigate('/login?error=session', { replace: true });
      });
    } else {
      navigate('/login?error=missing_token', { replace: true });
    }
  }, [navigate, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl">Procesando inicio de sesión...</p>
      </div>
    </div>
  );
};

export default AuthCallback;