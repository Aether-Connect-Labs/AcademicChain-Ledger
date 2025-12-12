import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium',
  variant = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const variantClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  };

  return (
    <div className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${variantClasses[variant]} border-t-transparent ${className}`} />
  );
};

const LoadingOverlay = ({ 
  message = 'Cargando...',
  show = true 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ 
  message = 'Cargando contenido...',
  className = '' 
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-8 flex flex-col items-center justify-center ${className}`}>
    <LoadingSpinner size="medium" />
    <p className="mt-4 text-gray-600 text-sm">{message}</p>
  </div>
);

export { LoadingSpinner, LoadingOverlay, LoadingCard };
export default LoadingSpinner;