import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConnectionService from './services/connectionService';
import CredentialVerifier from './credentials/CredentialVerifier';
import demoService from './services/demoService';
import { toGateway } from './utils/ipfsUtils';

function EnhancedStudentPortal({ demo = false }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      if (demo) {
        // Modo demo: intentar sincronizar con backend demo si está disponible
        try {
          const resp = await demoService.getCredentials();
          const list = Array.isArray(resp?.data) ? resp.data : [];
          const mapped = list.map((c) => ({
            id: c.id || `${c.tokenId}-${c.serialNumber}`,
            title: c.title || 'Credential',
            issuer: c.issuer || 'Demo Institution',
            issueDate: c.createdAt ? new Date(c.createdAt) : new Date(),
            expirationDate: null,
            metadata: {
              tokenId: c.tokenId,
              serialNumber: c.serialNumber,
              ipfsURI: c.ipfsURI
            }
          }));
          setCredentials(mapped);
        } catch {
          const demoData = ConnectionService.getDemoStudentData();
          setCredentials(demoData.credentials);
        }
        setConnectionStatus('demo');
        setLoading(false);
        return;
      }

      // Intentar conectar con backend real
      const isBackendAvailable = await ConnectionService.healthCheck();
      
      if (!isBackendAvailable) {
        // Fallback a datos demo
        try {
          const resp = await demoService.getCredentials();
          const list = Array.isArray(resp?.data) ? resp.data : [];
          const mapped = list.map((c) => ({
            id: c.id || `${c.tokenId}-${c.serialNumber}`,
            title: c.title || 'Credential',
            issuer: c.issuer || 'Demo Institution',
            issueDate: c.createdAt ? new Date(c.createdAt) : new Date(),
            expirationDate: null,
            metadata: {
              tokenId: c.tokenId,
              serialNumber: c.serialNumber,
              ipfsURI: c.ipfsURI
            }
          }));
          setCredentials(mapped);
        } catch {
          const demoData = ConnectionService.getDemoStudentData();
          setCredentials(demoData.credentials);
        }
        setConnectionStatus('demo');
        setLoading(false);
        return;
      }

      // Backend disponible - cargar datos reales
      const credsResponse = await ConnectionService.fetchWithFallback(
        '/api/students/credentials', 
        ConnectionService.getDemoStudentData().credentials
      );

      if (credsResponse.success) {
        setCredentials(credsResponse.data);
      }

      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error loading student data:', err);
      setError('Error al cargar tus credenciales');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { text: 'Sincronizando con la Red de Integridad...', color: 'text-blue-600', bg: 'bg-blue-100' },
      connected: { text: 'Conectado a la Red de Integridad', color: 'text-green-600', bg: 'bg-green-100' },
      demo: { text: 'Modo demo — Sincronización simulada', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      error: { text: 'Restableciendo enlace de seguridad...', color: 'text-red-600', bg: 'bg-red-100' }
    };

    const config = statusConfig[connectionStatus] || statusConfig.checking;

    return (
      <div className={`px-4 py-2 rounded-lg ${config.bg} ${config.color} text-sm font-medium mb-4 flex items-center gap-2`}>
        <span className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4" />
        <span>{config.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 pb-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Portal del Alumno</h1>
        <p className="text-gray-600">Gestiona y verifica tus credenciales académicas</p>
        {renderConnectionStatus()}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Credenciales del estudiante */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Mis Credenciales</h2>
        
        {credentials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tienes credenciales registradas</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((credential) => (
              <div key={credential.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{credential.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">Institución: {credential.issuer}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    Emitido: {new Date(credential.issueDate).toLocaleDateString()}
                  </p>
                  {credential.expirationDate && (
                    <p className="text-sm text-gray-600">
                      Expira: {new Date(credential.expirationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <button className="btn-primary w-full text-sm">Ver Detalles</button>
                  <button className="btn-outline w-full text-sm">Compartir</button>
                  <button className="btn-secondary w-full text-sm">Verificar</button>
                </div>
                
                {credential.metadata && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      {credential.metadata.studentId && (
                        <p>ID Estudiante: {credential.metadata.studentId}</p>
                      )}
                      {credential.metadata.gpa && (
                        <p>GPA: {credential.metadata.gpa}</p>
                      )}
                      {credential.metadata.honors && (
                        <p>Honores: {credential.metadata.honors}</p>
                      )}
                      {credential.metadata.tokenId && (
                        <p>Token ID: <span className="font-mono">{credential.metadata.tokenId}</span></p>
                      )}
                      {credential.metadata.serialNumber && (
                        <p>Serial: <span className="font-mono">{credential.metadata.serialNumber}</span></p>
                      )}
                      {credential.metadata.ipfsURI && (
                        <p>
                          IPFS:{' '}
                          <a
                            href={String(credential.metadata.ipfsURI).replace('ipfs://', 'https://dweb.link/ipfs/')}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {String(credential.metadata.ipfsURI).slice(0, 28)}…
                          </a>
                        </p>
                      )}
                      {credential.metadata.ipfsURI && (
                        <p>
                          Filecoin:{' '}
                          <a
                            href={String(credential.metadata.ipfsURI).replace('ipfs://', 'https://w3s.link/ipfs/')}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Copia verificada (web3.storage)
                          </a>
                        </p>
                      )}
                      {credential.metadata.tokenId && credential.metadata.serialNumber && (
                        <p>
                          Explorer:{' '}
                          <a
                            href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/nft/${credential.metadata.tokenId}-${credential.metadata.serialNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Ver en HashScan
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verificación con cámara */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Verificar Credencial con Cámara</h2>
        <CredentialVerifier />
      </div>

      {/* Acciones rápidas */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-secondary">Descargar Todas</button>
          <button className="btn-outline">Compartir Portfolio</button>
          <Link to="/agenda" className="btn-primary">Agendar Asesoría</Link>
          <button
            className="btn-primary"
            disabled={issuing}
            onClick={async () => {
              try {
                setIssuing(true);
                const resp = await demoService.issueCredential({ degree: 'Demo Ingeniería', studentName: 'Alumno Demo' });
                setIssueResult(resp?.data || null);
                await loadStudentData();
              } catch (e) {
                setIssueResult({ error: e.message || 'Error' });
              } finally {
                setIssuing(false);
              }
            }}
          >
            {issuing ? 'Emitiendo...' : 'Obtener Credencial Demo'}
          </button>
        </div>
      </div>

      {issueResult && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultado de Emisión Demo</h3>
          {'error' in issueResult ? (
            <p className="text-red-600">{String(issueResult.error)}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-700">NFT ID: <span className="font-mono">{String(issueResult.nftId || '')}</span></p>
              {issueResult.hashscanUrl ? (
                <a href={issueResult.hashscanUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Ver en HashScan</a>
              ) : null}
              {issueResult.anchors?.xrpl?.url ? (
                <a href={issueResult.anchors.xrpl.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">XRPL Anchor</a>
              ) : null}
              {issueResult.anchors?.algorand?.url ? (
                <a href={issueResult.anchors.algorand.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Algorand Anchor</a>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
        <p className="text-gray-600 mb-4">
          Si tienes problemas con tus credenciales o necesitas asistencia, contáctanos:
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="mailto:soporte@academicchain.com" className="text-blue-600 hover:text-blue-800">
            soporte@academicchain.com
          </a>
          <span className="text-gray-400">|</span>
          <Link to="/agenda" className="text-blue-600 hover:text-blue-800">
            Agendar cita con soporte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EnhancedStudentPortal;
