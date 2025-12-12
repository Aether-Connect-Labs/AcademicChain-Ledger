import React from 'react';

const StatusIndicator = ({ 
  status = 'default',
  size = 'medium',
  showLabel = true,
  className = '' 
}) => {
  const statusConfig = {
    checking: {
      color: 'bg-blue-400',
      label: 'Verificando conexión...',
      textColor: 'text-blue-700'
    },
    connected: {
      color: 'bg-green-400',
      label: 'Conectado',
      textColor: 'text-green-700'
    },
    demo: {
      color: 'bg-yellow-400',
      label: 'Modo demo',
      textColor: 'text-yellow-700'
    },
    error: {
      color: 'bg-red-400',
      label: 'Error de conexión',
      textColor: 'text-red-700'
    },
    warning: {
      color: 'bg-orange-400',
      label: 'Advertencia',
      textColor: 'text-orange-700'
    },
    default: {
      color: 'bg-gray-400',
      label: 'Estado desconocido',
      textColor: 'text-gray-700'
    }
  };

  const sizeConfig = {
    small: {
      dot: 'h-2 w-2',
      text: 'text-xs'
    },
    medium: {
      dot: 'h-3 w-3',
      text: 'text-sm'
    },
    large: {
      dot: 'h-4 w-4',
      text: 'text-base'
    }
  };

  const config = statusConfig[status] || statusConfig.default;
  const sizeInfo = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${config.color} ${sizeInfo.dot} rounded-full animate-pulse`} />
      {showLabel && (
        <span className={`${config.textColor} ${sizeInfo.text} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;