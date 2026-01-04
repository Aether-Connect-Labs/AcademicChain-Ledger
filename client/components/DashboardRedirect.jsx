import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const role = user?.role;
    const target =
      role === 'admin'
        ? '/admin'
        : role === 'university' || role === 'institution'
        ? '/institution/dashboard'
        : role === 'student'
        ? '/student/portal'
        : '/';
    navigate(target, { replace: true });
  }, [navigate, user, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Redireccionando…</div>
    </div>
  );
};

export default DashboardRedirect;
