import React from 'react';
const isDev = import.meta.env.DEV;
const capture = async (error, options) => {
  if (isDev) return null;
  try {
    const mod = await import("@sentry/react");
    return mod.captureException(error, options);
  } catch { return null; }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      eventId: null
    };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
    this.reportToSentry = this.reportToSentry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Capturar en Sentry con más contexto
    const self = this;
    (async () => {
      const eventId = await capture(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        },
        tags: {
          component: 'ErrorBoundary',
          error_type: 'react_component_error'
        }
      });
      self.setState({ errorInfo, eventId });
    })();

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo, eventId);
    }
  }

  resetErrorBoundary() {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null 
    });
    
    // Llamar callback de reset personalizado
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  reportToSentry() {
    if (this.state.eventId) {
      // Mostrar ID del error para el usuario (opcional)
      alert(`Error reportado con ID: ${this.state.eventId}. Nuestro equipo ha sido notificado.`);
    }
  }

  renderErrorSection() {
    const { 
      errorMessage = "Algo salió mal",
      showDetails = process.env.NODE_ENV === 'development',
      customUI,
      showReportButton = true,
      showResetButton = true
    } = this.props;

    const { error, errorInfo, eventId } = this.state;

    // UI personalizada si se proporciona
    if (customUI) {
      return React.createElement(customUI, {
        error,
        errorInfo,
        eventId,
        onReset: this.resetErrorBoundary,
        onReport: this.reportToSentry
      });
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">¡Ups! Algo salió mal</h1>
            <p className="opacity-90">{errorMessage}</p>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Mensaje principal */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Hemos detectado un error inesperado en la aplicación. 
                Nuestro equipo ha sido notificado automáticamente.
              </p>
              
              {eventId && (
                <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
                  <span className="font-mono text-xs">ID: {eventId}</span>
                </div>
              )}
            </div>

            {/* Detalles del error (solo en desarrollo) */}
            {showDetails && error && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <details className="cursor-pointer">
                  <summary className="font-medium text-gray-700 mb-2">
                    Detalles técnicos (Desarrollo)
                  </summary>
                  <div className="mt-2 space-y-3">
                    <div>
                      <strong className="text-sm text-gray-600">Error:</strong>
                      <pre className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <strong className="text-sm text-gray-600">Component Stack:</strong>
                        <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showResetButton && (
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-soft hover-lift flex items-center justify-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Reintentar</span>
                </button>
              )}
              
              {showReportButton && (
                <button
                  onClick={this.reportToSentry}
                  className="flex-1 bg-gradient-to-r from-secondary-500 to-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-secondary-600 hover:to-primary-700 transition-all shadow-soft hover-lift flex items-center justify-center space-x-2"
                >
                  <span>📧</span>
                  <span>Reportar Error</span>
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>🏠</span>
                <span>Ir al Inicio</span>
              </button>
            </div>

            {/* Información adicional */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>Si el problema persiste, contacta a nuestro equipo de soporte.</p>
              <div className="flex justify-center space-x-4 text-xs">
                <a href="mailto:soporte@academicchain.com" className="text-secondary-600 hover:text-secondary-700">
                  ✉️ soporte@academicchain.com
                </a>
                <span>•</span>
                <a href="tel:+1234567890" className="text-secondary-600 hover:text-secondary-700">
                  📞 +1 (234) 567-890
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorSection();
    }

    return this.props.children;
  }
}

// Higher-Order Component para usar el ErrorBoundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Hook personalizado para errores
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    setError(error);
    capture(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

export default ErrorBoundary;
