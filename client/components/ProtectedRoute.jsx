// client/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import LoadingSpinner from './ui/LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const roles = requiredRoles || requiredRole;
  const userHasRequiredRole = roles ? (user && roles.includes(user.role)) : true;

  if (!isAuthenticated || !userHasRequiredRole) {
    // Redirige al login, guardando la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;