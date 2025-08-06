import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { VerificationResult } from './VerificationResult';

const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
  loading: () => <div className="bg-gray-200 w-full h-64 rounded-lg animate-pulse"></div>
});

export function QRVerifier() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);

  const handleScan = async (data: string | null) => {
    if (!data || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/credentials/verify?qr=${encodeURIComponent(data)}`);
      if (!response.ok) throw new Error('Verification failed');
      
      const resultData = await response.json();
      setResult(resultData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError('');
    if (scannerRef.current) scannerRef.current.restart();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-blue-500">
        <QrScanner
          ref={scannerRef}
          onScan={handleScan}
          onError={(err) => setError(err.message)}
          constraints={{ facingMode: 'environment' }}
          className="w-full"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg font-semibold">Verificando...</div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={handleRetry}
            className="ml-2 text-red-800 font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {result && <VerificationResult data={result} />}
    </div>
  );
}