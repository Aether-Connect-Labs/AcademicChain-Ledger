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
    if (token && setSession) {
      (async () => {
        try {
          await setSession(token);
          const profile = await authService.getCurrentUser(token);
          const role = profile?.role;
          if (role === 'admin' || role === 'university' || role === 'institution') {
            navigate('/institution/dashboard', { replace: true });
          } else if (role === 'student') {
            navigate('/student/portal', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
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