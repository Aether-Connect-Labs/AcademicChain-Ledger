// client/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin'; // Corregido
import LoadingSpinner from './ui/LoadingSpinner'; // Corregido

const ProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const { isAuthenticated, user, isLoading } = useAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== requiredRole) {
    // Redirige al login, guardando la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;