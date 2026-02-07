import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Briefcase, Wallet, ShoppingBag } from 'lucide-react';
import ConnectionService from './services/connectionService';
import CredentialVerifier from './credentials/CredentialVerifier';
import demoService from './services/demoService';
import { motion } from 'framer-motion';
import { toGateway } from './utils/ipfsUtils';

function EnhancedStudentPortal({ demo = false }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Mi Trayectoria', icon: BookOpen },
    { id: 'wallet', label: 'Billetera Digital', icon: Wallet },
    { id: 'marketplace', label: 'Beneficios', icon: ShoppingBag }
  ];

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      // Check Real Backend first
      const isBackendAvailable = await ConnectionService.healthCheck();

      if (!isBackendAvailable || demo) {
        // Fallback/Demo Logic (simplified for brevity, keeping existing fetch logic structure)
        try {
          const resp = await demoService.getCredentials();
          const list = Array.isArray(resp?.data) ? resp.data : [];
          setCredentials(list.map(mapCredential));
        } catch {
          setCredentials(ConnectionService.getDemoStudentData().credentials);
        }
        setConnectionStatus('demo');
      } else {
        // Real Backend
        const credsResponse = await ConnectionService.fetchWithFallback(
          '/api/students/credentials',
          ConnectionService.getDemoStudentData().credentials
        );
        if (credsResponse.success) {
          setCredentials(credsResponse.data);
        }
        setConnectionStatus('connected');
      }
    } catch (err) {
      setError('Error al cargar tus credenciales');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const mapCredential = (c) => ({
    id: c.id || `${c.tokenId}-${c.serialNumber}`,
    title: c.title || 'Credential',
    issuer: c.issuer || 'Demo Institution',
    issueDate: c.createdAt ? new Date(c.createdAt) : new Date(),
    expirationDate: null,
    metadata: {
      tokenId: c.tokenId,
      serialNumber: c.serialNumber,
      ipfsURI: c.ipfsURI,
      ...c.metadata
    }
  });

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { text: 'Sincronizando...', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
      connected: { text: 'Red Activa', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
      demo: { text: 'Modo Simulación', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
      error: { text: 'Error de Red', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
    };
    const config = statusConfig[connectionStatus] || statusConfig.checking;
    return (
      <div className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-full border ${config.bg} ${config.color} text-[10px] md:text-xs font-bold font-mono flex items-center gap-1.5 md:gap-2 shadow-sm whitespace-nowrap`}>
        <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
        <span>{config.text}</span>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #7c3aed 0%, transparent 40%), radial-gradient(circle at 20% 80%, #06b6d4 0%, transparent 40%)' }}></div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <img
                  src={toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q')}
                  alt="AcademicChain Logo"
                  className="h-10 w-10 rounded-full shadow-sm object-contain bg-white"
                />
                <div className="flex flex-col">
                   <h3 className="text-lg font-bold text-slate-900 leading-none tracking-tight">AcademicChain</h3>
                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Impulsado por AcademicChain</p>
                </div>
             </div>
             <div className="hidden md:block h-8 w-px bg-slate-300 mx-2"></div>
             
             {/* Portal Title & Status - Optimized for visibility */}
             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                 <h1 className="hidden md:block text-lg font-display font-bold text-slate-700">Portal Académico</h1>
                 <div className="">{renderConnectionStatus()}</div>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-slate-800">Alumno</span>
              <span className="text-xs text-slate-500">ID: 2024-8592</span>
            </div>
            <div className="h-10 w-10 rounded-full border border-slate-200 p-1">
              <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">IMG</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                item.id === 'dashboard' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Credentials Grid */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">✦</span> Mis Credenciales
            </h2>

            {credentials.length === 0 ? (
              <div className="text-center py-12 glass-panel">
                <p className="text-slate-400">No tienes credenciales registradas aún.</p>
                <button
                  className="mt-4 btn-primary btn-sm"
                  disabled={issuing}
                  onClick={async () => {
                    try {
                      setIssuing(true);
                      const resp = await demoService.issueCredential({ degree: 'Ingeniería Demo', studentName: 'Alumno Demo' });
                      setIssueResult(resp?.data || null);
                      await loadStudentData();
                    } catch (e) {
                      setIssueResult({ error: e.message });
                    } finally {
                      setIssuing(false);
                    }
                  }}
                >
                  {issuing ? 'Minteando...' : 'Obtener Credencial Demo'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {credentials.map((cred) => (
                  <motion.div
                    key={cred.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 relative group hover:shadow-neon-blue transition-all duration-300 border-t-2 border-t-transparent hover:border-t-primary"
                  >
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        🎓
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-secondary-400 font-mono mb-1">{cred.issuer}</div>
                      <h3 className="text-lg font-bold text-white line-clamp-2">{cred.title}</h3>
                      <div className="text-xs text-slate-500 mt-2">Emitido: {new Date(cred.issueDate).toLocaleDateString()}</div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs bg-black/30 p-2 rounded">
                        <span className="text-slate-400">Token ID</span>
                        <span className="font-mono text-primary-300">{cred.metadata?.tokenId || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between text-xs bg-black/30 p-2 rounded">
                        <span className="text-slate-400">Serial</span>
                        <span className="font-mono text-secondary-300">#{cred.metadata?.serialNumber || '00'}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <a
                        href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || 'testnet'}/nft/${cred.metadata?.tokenId}-${cred.metadata?.serialNumber}`}
                        target="_blank" rel="noreferrer"
                        className="flex-1 btn-ghost text-center text-xs border border-slate-700 hover:border-primary"
                      >
                        HashScan
                      </a>
                      <button className="flex-1 btn-primary text-xs py-2">
                        Verificar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions & Verifier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4">Verificador Holográfico</h2>
              <p className="text-sm text-slate-400 mb-4">Escanea un código QR para verificar la autenticidad de un título en tiempo real.</p>
              <div className="bg-black/40 rounded-xl p-4 min-h-[200px] flex items-center justify-center border border-slate-700 border-dashed">
                <CredentialVerifier />
              </div>
            </div>

            <div className="glass-panel p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h2 className="text-xl font-bold mb-4">Portfolio Académico</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-between group">
                  <span className="text-slate-300 group-hover:text-white">Exportar CV Verificado (PDF)</span>
                  <span className="text-slate-500">⬇</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-between group">
                  <span className="text-slate-300 group-hover:text-white">Compartir enlace público</span>
                  <span className="text-slate-500">🔗</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-slate-700 flex items-center justify-between group">
                  <span className="text-slate-300 group-hover:text-white">Agendar Asesoría</span>
                  <span className="text-slate-500">📅</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default EnhancedStudentPortal;
