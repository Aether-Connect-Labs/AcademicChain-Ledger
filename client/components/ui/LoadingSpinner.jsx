import React from 'react';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const cls = sizes[size] || sizes.md;
  return (
    <div className={`spinner ${cls} ${className}`}></div>
  );
};

export default LoadingSpinner;