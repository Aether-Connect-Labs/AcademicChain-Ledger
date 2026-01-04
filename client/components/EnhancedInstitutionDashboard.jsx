import React, { useEffect, useState } from 'react';
import ConnectionService from './services/connectionService';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import DocumentViewer from './ui/DocumentViewer';
import demoService from './services/demoService';

function EnhancedInstitutionDashboard({ demo = false }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      if (demo) {
        // Modo demo - datos predefinidos
        const demoData = ConnectionService.getDemoInstitutionData();
        setCredentials(demoData.credentials);
        setStats(demoData.stats);
        setConnectionStatus('demo');
        setLoading(false);
        return;
      }

      // Intentar conectar con backend real
      const isBackendAvailable = await ConnectionService.healthCheck();
      
      if (!isBackendAvailable) {
        // Fallback a datos demo
        const demoData = ConnectionService.getDemoInstitutionData();
        setCredentials(demoData.credentials);
        setStats(demoData.stats);
        setConnectionStatus('demo');
        setLoading(false);
        return;
      }

      // Backend disponible - cargar datos reales
      const [credsResponse, statsResponse] = await Promise.allSettled([
        ConnectionService.fetchWithFallback('/api/universities/credentials', ConnectionService.getDemoInstitutionData().credentials),
        ConnectionService.fetchWithFallback('/api/universities/statistics', ConnectionService.getDemoInstitutionData().stats)
      ]);

      if (credsResponse.status === 'fulfilled') {
        setCredentials(credsResponse.value.data);
      }

      if (statsResponse.status === 'fulfilled') {
        const resp = statsResponse.value.data;
        const payload = resp?.data || {};
        const statsMapped = (() => {
          const s = payload.statistics || {};
          const recent = Array.isArray(s.recentActivity) ? s.recentActivity : [];
          const lastMint = recent.find(e => String(e.type).toUpperCase() === 'CREDENTIAL_MINTED');
          return {
            totalCredentials: Number(s.totalCredentialsIssued || 0),
            totalTokens: Number(s.activeTokens || 0),
            totalRecipients: 0,
            lastIssuance: lastMint ? lastMint.date : null
          };
        })();
        setStats(statsMapped);
      }

      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar los datos');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { text: 'Verificando conexión...', color: 'text-blue-600', bg: 'bg-blue-100' },
      connected: { text: 'Conectado al backend', color: 'text-green-600', bg: 'bg-green-100' },
      demo: { text: 'Modo demo - Datos de ejemplo', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      error: { text: 'Error de conexión', color: 'text-red-600', bg: 'bg-red-100' }
    };

    const config = statusConfig[connectionStatus] || statusConfig.checking;

    return (
      <div className={`px-4 py-2 rounded-lg ${config.bg} ${config.color} text-sm font-medium mb-4`}>
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Institución</h1>
        <p className="text-gray-600">Gestiona tus credenciales académicas y emisiones</p>
        {renderConnectionStatus()}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Credenciales</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCredentials || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tokens Activos</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalTokens || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Estudiantes</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalRecipients || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Última Emisión</h3>
            <p className="text-sm text-gray-600">
              {stats.lastIssuance ? new Date(stats.lastIssuance).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Formularios de emisión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Emitir Credencial Individual</h2>
          <IssueTitleForm demo={connectionStatus === 'demo'} />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Emisión Masiva</h2>
          <BatchIssuance demo={connectionStatus === 'demo'} />
        </div>
      </div>

      {/* Lista de credenciales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Credenciales Emitidas</h2>
        
        {credentials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay credenciales emitidas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {credentials.slice(0, 10).map((cred) => (
                  <tr key={cred.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cred.studentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cred.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cred.tokenId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cred.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acciones adicionales */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Ver Todas las Credenciales</button>
          <button className="btn-secondary">Generar Reporte</button>
          <button className="btn-outline">Sincronizar con Blockchain</button>
          <button
            className="btn-primary"
            disabled={issuing}
            onClick={async () => {
              try {
                setIssuing(true);
                const resp = await demoService.issueCredential({ degree: 'Demo Ingeniería', studentName: 'Juan Demo' });
                setIssueResult(resp?.data || null);
              } catch (e) {
                setIssueResult({ error: e.message || 'Error' });
              } finally {
                setIssuing(false);
              }
            }}
          >
            {issuing ? 'Emitiendo...' : 'Emitir Credencial Demo'}
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
    </div>
  );
}

export default EnhancedInstitutionDashboard;
