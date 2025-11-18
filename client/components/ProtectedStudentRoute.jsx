import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import LoadingSpinner from './ui/LoadingSpinner.jsx';

const ProtectedStudentRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return <Navigate to="/students/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedStudentRoute;