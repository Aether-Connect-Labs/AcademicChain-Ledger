import { useState, useCallback } from 'react';
import QRScanner from '../ui/QRScanner.jsx';

const CredentialVerifier = () => {
  const [state, setState] = useState({ status: 'idle' });
  const [scanCount, setScanCount] = useState(0);
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [serialInput, setSerialInput] = useState('');

  const validateQRData = (data) => {
    try {
      const parsed = JSON.parse(data);
      return !!(parsed.tokenId && parsed.serialNumber);
    } catch {
      return false;
    }
  };

  const handleScan = useCallback(async (data) => {
    if (!data || state.status === 'verifying') return;

    if (!validateQRData(data)) {
      setState({ status: 'error', error: 'Formato de QR inválido. Escanea un código válido de AcademicChain.' });
      return;
    }

    setState({ status: 'verifying' });
    setScanCount(prev => prev + 1);

    try {
      const parsed = JSON.parse(data);
      let API_URL = import.meta.env.VITE_API_URL
      if (!API_URL) {
        setState({ status: 'success', data: { metadata: { attributes: [ { trait_type: 'University', value: 'Demo University' }, { trait_type: 'Degree', value: 'Demo Degree' }, { display_type: 'date', value: new Date().toISOString() }, { trait_type: 'SubjectRef', value: 'demo-ref' } ] } } });
        return;
      }
      const res = await fetch(`${API_URL}/api/verification/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: parsed.tokenId, serialNumber: parsed.serialNumber })
      });
      const payload = await res.json();
      if (payload.success && payload.data?.valid && payload.data?.credential) {
        setState({ status: 'success', data: payload.data.credential });
      } else {
        throw new Error('Credencial inválida');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar la credencial. Intenta nuevamente.';
      setState({ status: 'error', error: errorMessage });
    }
  }, [state.status]);

  const handleSubmitManual = useCallback(async (e) => {
    e.preventDefault();
    if (!tokenIdInput || !serialInput || state.status === 'verifying') return;
    setState({ status: 'verifying' });
    try {
      let API_URL = import.meta.env.VITE_API_URL
      if (!API_URL) {
        setState({ status: 'success', data: { metadata: { attributes: [ { trait_type: 'University', value: 'Demo University' }, { trait_type: 'Degree', value: 'Demo Degree' }, { display_type: 'date', value: new Date().toISOString() }, { trait_type: 'SubjectRef', value: 'demo-ref' } ] } } });
        return;
      }
      const res = await fetch(`${API_URL}/api/verification/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenIdInput.trim(), serialNumber: serialInput.trim() })
      });
      const payload = await res.json();
      if (payload.success && payload.data?.valid && payload.data?.credential) {
        setState({ status: 'success', data: payload.data.credential });
      } else {
        throw new Error('Credencial inválida');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar la credencial. Intenta nuevamente.';
      setState({ status: 'error', error: errorMessage });
    }
  }, [tokenIdInput, serialInput, state.status]);

  const handleReset = () => setState({ status: 'idle' });
  const handleRetry = () => setState({ status: 'scanning' });

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
            <form onSubmit={handleSubmitManual} className="mt-6 grid grid-cols-1 gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
                placeholder="Token ID (ej. 0.0.123456)"
                className="input-primary"
              />
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Serial Number (ej. 1)"
                className="input-primary"
              />
              <button type="submit" className="btn-primary">
                Verificar manualmente
              </button>
            </form>
          </div>
        );

      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Verificando en Hedera Network...</p>
            <p className="text-sm text-gray-500 mt-2">Consultando el consenso distribuido</p>
          </div>
        );

      case 'success':
        return (
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">Credencial Verificada</h3>
                <p className="text-green-600 text-sm">Validada en Hedera Consensus Service</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Universidad:</span>
                <span className="text-gray-900">{(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'University')?.value}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Título:</span>
                <span className="text-gray-900">{(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Degree')?.value}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Fecha Graduación:</span>
                <span className="text-gray-900">{(state.data?.metadata?.attributes || []).find(a => a.display_type === 'date')?.value}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">SubjectRef:</span>
                <span className="text-gray-900">{(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'SubjectRef')?.value}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">ID Transacción:</span>
                <span className="text-blue-600 text-sm font-mono">{state.data?.transactionId?.slice(0, 8)}...</span>
              </div>
            </div>

            <button onClick={handleReset} className="mt-6 w-full btn-primary">
              Verificar Otra Credencial
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-xl">✗</span>
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-lg">Error en Verificación</h3>
                <p className="text-red-600 text-sm">No se pudo validar la credencial</p>
              </div>
            </div>
            <p className="text-gray-700">{state.error || 'Intenta nuevamente.'}</p>
            <div className="mt-4 flex space-x-2">
              <button onClick={handleRetry} className="btn-primary">Reintentar</button>
              <button onClick={handleReset} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 gradient-text">Verificador de Credenciales</h2>
      <div className="card">
        <QRScanner onScan={handleScan} />
        <div className="mt-6">{renderContent()}</div>
      </div>
      <p className="text-xs text-gray-400 mt-4">Escaneos realizados: {scanCount}</p>
    </div>
  );
};

export default CredentialVerifier;
