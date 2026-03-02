import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import Button from './ui/Button';
import { Card } from './ui/Card';

const CertificateRequest = () => {
  const [formData, setFormData] = useState({
    studentName: 'Estudiante Demo',
    studentId: `STU-${Math.floor(Math.random() * 10000)}`,
    courseName: 'Blockchain Developer 101',
    institutionId: 'INST-001',
    graduationDate: new Date().toISOString().split('T')[0]
  });
  
  const [status, setStatus] = useState('idle'); // idle, processing, completed, error
  const [ipfsCid, setIpfsCid] = useState(null);
  const [hcsTxId, setHcsTxId] = useState(null);
  const [hcsStatus, setHcsStatus] = useState(null); // 'verified', 'simulated', 'skipped'
  const [error, setError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('processing');
    setError(null);
    setPollingAttempts(0);
    setHcsTxId(null);
    setHcsStatus(null);
    setIpfsCid(null);

    try {
      const response = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error al iniciar la solicitud');
      
      console.log('Solicitud iniciada:', data);
      if (data.details && data.details.hcsTransactionId) {
        setHcsTxId(data.details.hcsTransactionId);
        setHcsStatus(data.details.hcsStatus);
      }
      
      // Iniciar polling (el useEffect se encargará)
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    let interval;
    if (status === 'processing') {
      const poll = async () => {
        try {
          if (pollingAttempts > 20) {
            setStatus('error');
            setError('Tiempo de espera agotado. El certificado tarda más de lo esperado.');
            return;
          }

          const response = await fetch(`/api/student/${formData.studentId}/status`);
          if (response.ok) {
            const data = await response.json();
            console.log('Polling status:', data);

            if (data.status === 'completed' && data.ipfsCid) {
              setIpfsCid(data.ipfsCid);
              setStatus('completed');
              clearInterval(interval);
            } else if (data.status === 'error') {
               setStatus('error');
               setError('Error en el proceso de certificación');
               clearInterval(interval);
            }
          }
          setPollingAttempts(prev => prev + 1);
        } catch (err) {
          console.error('Polling error:', err);
          // Don't set error state immediately on transient network errors
        }
      };

      interval = setInterval(poll, 3000);
      poll(); // Initial check
    }
    return () => clearInterval(interval);
  }, [status, formData.studentId, pollingAttempts]);

  const resetForm = () => {
    setStatus('idle');
    setFormData({
      ...formData,
      studentId: `STU-${Math.floor(Math.random() * 10000)}`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <Card className="max-w-md w-full p-8 space-y-6 bg-white shadow-xl rounded-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Emisión de Certificados</h2>
          <p className="mt-2 text-sm text-gray-600">AcademicChain Ledger</p>
        </div>

        {status === 'idle' && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Estudiante</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ID Estudiante</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Curso / Programa</label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <Button type="submit" className="w-full flex justify-center py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium shadow-sm transition-colors duration-200">
              Solicitar Certificado
            </Button>
          </form>
        )}

        {status === 'processing' && (
          <div className="text-center space-y-6 py-8 flex flex-col items-center">
            <div className="relative">
              <LoadingSpinner size="large" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                {hcsTxId ? 'Registrando en Hedera Consensus Service...' : 'Iniciando proceso de certificación...'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {hcsTxId ? 'Transacción enviada a la red. Esperando confirmación y anclaje IPFS.' : 'Estamos asegurando tu documento en IPFS y Hedera.'}
              </p>
              {hcsTxId && (
                <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700 font-mono break-all">
                  TX: {hcsTxId}
                </div>
              )}
            </div>
            
            <div className="w-full max-w-xs mx-auto mt-6">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                <span className="text-blue-600">Request</span>
                <span className={hcsTxId ? "text-blue-600" : ""}>Hedera HCS</span>
                <span className="">Processing</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: hcsTxId ? '66%' : '33%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">¡Certificado Emitido!</h3>
            
            <div className="space-y-4 text-left">
              <div className="bg-gray-50 p-4 rounded-lg break-all">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 font-semibold">IPFS CID (Contenido)</p>
                <a href={`https://ipfs.io/ipfs/${ipfsCid}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                  {ipfsCid}
                </a>
              </div>

              {hcsTxId && (
                <div className={`p-4 rounded-lg break-all border ${hcsStatus === 'simulated' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Hedera Transaction ID</p>
                    {hcsStatus === 'simulated' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Simulated
                      </span>
                    )}
                  </div>
                  <a 
                    href={`https://hashscan.io/testnet/transaction/${hcsTxId.replace('@', '-').replace('.', '-')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-mono text-blue-600 hover:underline block mb-1"
                  >
                    {hcsTxId}
                  </a>
                  {hcsStatus === 'simulated' && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-start">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Connection to Hedera failed. Using simulated ID for demonstration flow.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <a 
                href={`https://ipfs.io/ipfs/${ipfsCid}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full justify-center bg-green-600 hover:bg-green-700 text-white">
                  Ver Certificado Original
                </Button>
              </a>
              
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={resetForm}
              >
                Emitir Otro
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
           <div className="text-center space-y-6 py-8">
             <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
               <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-gray-900">Ocurrió un error</h3>
             <p className="text-sm text-red-500 font-medium">
               {error || 'No se pudo completar la solicitud.'}
             </p>
             <Button 
               variant="outline" 
               className="w-full justify-center mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
               onClick={() => setStatus('idle')}
             >
               Intentar de nuevo
             </Button>
           </div>
        )}
      </Card>
    </div>
  );
};

export default CertificateRequest;
