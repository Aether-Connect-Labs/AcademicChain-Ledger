// src/components/credentials/CredentialVerifier.tsx
import { useState, useCallback } from 'react';
import { verifyCredential } from '../../lib/hedera/verification';
import QRScanner from '../ui/QRScanner';
import { CredentialData, VerificationResult } from '../../types/credentials';

// Estados más específicos
type VerificationState = 
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'verifying' }
  | { status: 'success'; data: CredentialData }
  | { status: 'error'; error: string };

const CredentialVerifier = () => {
  const [state, setState] = useState<VerificationState>({ status: 'idle' });
  const [scanCount, setScanCount] = useState(0);

  // Validación mejorada del QR
  const validateQRData = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      return !!(parsed.credentialId && parsed.transactionId);
    } catch {
      return false;
    }
  };

  // Manejo de escaneo con mejor UX
  const handleScan = useCallback(async (data: string) => {
    if (!data || state.status === 'verifying') return;

    // Validar formato antes de procesar
    if (!validateQRData(data)) {
      setState({ 
        status: 'error', 
        error: 'Formato de QR inválido. Escanea un código válido de AcademicChain.' 
      });
      return;
    }

    setState({ status: 'verifying' });
    setScanCount(prev => prev + 1);

    try {
      const result = await verifyCredential(data);
      
      if (result.valid && result.data) {
        setState({ 
          status: 'success', 
          data: result.data 
        });
      } else {
        throw new Error(result.error || 'Credencial inválida');
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al verificar la credencial. Intenta nuevamente.';
      
      setState({ status: 'error', error: errorMessage });
    }
  }, [state.status]);

  const handleReset = () => {
    setState({ status: 'idle' });
  };

  const handleRetry = () => {
    setState({ status: 'scanning' });
  };

  // Renderizado condicional mejorado
  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-gray-600 mb-4">
              Escanea el código QR de una credencial académica para verificar su autenticidad en Hedera
            </p>
          </div>
        );

      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Verificando en Hedera Network...</p>
            <p className="text-sm text-gray-500 mt-2">
              Consultando el consenso distribuido
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">
                  Credencial Verificada
                </h3>
                <p className="text-green-600 text-sm">
                  Validada en Hedera Consensus Service
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Estudiante:</span>
                <span className="text-gray-900">{state.data.studentName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Título:</span>
                <span className="text-gray-900">{state.data.degree}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Institución:</span>
                <span className="text-gray-900">{state.data.institution}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Fecha Emisión:</span>
                <span className="text-gray-900">
                  {new Date(state.data.issuedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">ID Transacción:</span>
                <span className="text-blue-600 text-sm font-mono">
                  {state.data.transactionId?.slice(0, 8)}...
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Verificar Otra Credencial
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-xl">✗</span>
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-lg">
                  Error en Verificación
                </h3>
                <p className="text-red-600 text-sm">
                  No se pudo validar la credencial
                </p>
              </div>
            </div>
            
            <p className="text-red-700 mb-4">{state.error}</p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Nuevo Escaneo
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verificador de Credenciales
        </h2>
        <p className="text-gray-600">
          Autentica documentos académicos en blockchain
        </p>
      </div>

      {/* Mostrar QR Scanner solo cuando sea necesario */}
      {(state.status === 'idle' || state.status === 'scanning') && (
        <div className="mb-6">
          <QRScanner 
            onScan={handleScan}
            isActive={state.status !== 'verifying'}
          />
        </div>
      )}

      {/* Contenido dinámico */}
      {renderContent()}

      {/* Estadísticas */}
      {scanCount > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Escaneos realizados: {scanCount}</p>
        </div>
      )}
    </div>
  );
};

export default CredentialVerifier;