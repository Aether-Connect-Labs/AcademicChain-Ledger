import React from 'react';

const Card = ({ 
  children, 
  className = '',
  variant = 'default',
  ...props 
}) => {
  const baseClasses = 'rounded-lg border';
  
  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-md',
    subtle: 'bg-gray-50 border-gray-100',
    primary: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  };
  
  const classes = [
    baseClasses,
    variants[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardContent, CardFooter };