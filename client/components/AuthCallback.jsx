import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { authService } from './authService';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const nextParam = params.get('next');
    if (token && setSession) {
      (async () => {
        try {
          await setSession(token);
          const profile = await authService.getCurrentUser(token);
          const role = profile?.role;
          let nextLocal = null;
          try { nextLocal = localStorage.getItem('postLoginNext'); localStorage.removeItem('postLoginNext'); } catch {}
          const target = nextParam || nextLocal || (role === 'admin' || role === 'university' || role === 'institution' ? '/institution/dashboard' : role === 'student' ? '/student/portal' : '/');
          navigate(target, { replace: true });
        } catch {
          navigate('/login?error=session', { replace: true });
        }
      })();
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
