import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import CreatorIssuance from './CreatorIssuance';
import CreatorStepper from './CreatorStepper';
import { toGateway } from './utils/ipfsUtils';
import apiService from './services/apiService';
import { verificationService } from './services/verificationService';
import useAnalytics from './useAnalytics';
import { toast, Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CreatorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Notification Listener for "Hired" Event
  useEffect(() => {
    const handleHired = (event) => {
        const { studentName, employerName, courseName } = event.detail || {};
        
        // Play sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Success bell
        audio.play().catch(e => console.log('Audio play failed', e));

        // Show Toast
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-green-500`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <span className="text-3xl">🎉</span>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">
                                ¡Nueva Contratación Confirmada!
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                <span className="text-green-400 font-bold">{studentName}</span> ha sido contratado por <span className="text-blue-400 font-bold">{employerName}</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Certificado: {courseName}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 8000 });

        // Update stats
        setStats(prev => ({
            ...prev,
            impactoLaboral: (prev.impactoLaboral || 0) + 1,
            successRate: Math.min(100, (prev.successRate || 95) + 0.5)
        }));
    };

    const handleBatchComplete = (event) => {
        const { count } = event.detail || {};
        if (count > 0) {
            setStats(prev => ({
                ...prev,
                totalIssued: (prev.totalIssued || 0) + count
            }));
            toast.success(`Lote completado: Se emitieron ${count} certificados.`);
        }
    };

    window.addEventListener('acl:hired', handleHired);
    window.addEventListener('acl:batch-complete', handleBatchComplete);
    
    // Listen to localStorage for cross-tab events
    const handleStorage = (e) => {
        if (e.key === 'acl:event:hired') {
            const data = JSON.parse(e.newValue);
            handleHired({ detail: data });
        }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('acl:hired', handleHired);
        window.removeEventListener('acl:batch-complete', handleBatchComplete);
        window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      toast(location.state.message, { 
        icon: location.state.type === 'success' ? '✅' : 'ℹ️',
        duration: 4000 
      });
      // Clear state to prevent sticky toast
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Mock data states
  const [, setCredentials] = useState([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState('');
  const [stats, setStats] = useState({
    totalIssued: 0,
    impactoLaboral: 0,
    rankingSkills: 'Solidity, React',
    uptime: '99.9%'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const { trackCredentialOperation } = useAnalytics();
  const [creatorProfile] = useState({
    name: 'Creador Demo',
    did: 'did:hedera:testnet:z6Mk...',
    brand: 'Mi Universidad',
    apiKey: 'sk_live_51M...'
  });

  const loadCreatorData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock Data
      const mockCredentials = [
        {
          studentName: 'Ana García',
          credentialType: 'Curso: Marketing Digital',
          issuedAt: new Date().toISOString(),
          metadata: { mentorVerified: true },
          issuerBrand: 'Academia Demo',
          tokenId: '0.0.123456',
          serialNumber: '101'
        },
        // ... more mock data
      ];

      setCredentials(mockCredentials);
      calculateStats(mockCredentials);
      setRecentActivity(mockCredentials);
      
    } catch (err) {
      setError('Error al cargar datos del creador');
      console.error('Creator dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (credentials) => {
    // Mock stats calculation + base values to look populated
    setStats({
      totalIssued: 154,
      impactoLaboral: 42, // Mocked "Hired" count
      rankingSkills: 'Solidity #1',
      uptime: '100% (Arkhia)'
    });
  };

  const monthlyData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Certificados Emitidos',
      data: [12, 19, 8, 15, 22, 18],
      backgroundColor: '#06b6d4', // Cyan-500
      borderColor: '#3b82f6', // Blue-500
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const typeDistribution = {
    labels: ['Cursos', 'Talleres', 'Bootcamps', 'Mentorías'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#0ea5e9'], // Cyan, Blue, Purple, Sky
      borderColor: '#0f172a', // Slate-900
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // Slate-400
          font: { size: 12, weight: 'bold' }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' } // Slate-700
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [loadCreatorData]);

  const handleDelete = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No hay identificadores de credencial disponibles en este elemento.');
      return;
    }
    const ok = window.confirm('¿Borrar esta emisión del portal de Creador? No afecta estado on-chain.');
    if (!ok) return;
    try {
      await apiService.deleteCredential({ tokenId: item.tokenId, serialNumber: item.serialNumber });
      setRecentActivity(prev => prev.filter(x => !(String(x.tokenId) === String(item.tokenId) && String(x.serialNumber) === String(item.serialNumber))));
      setDeletedCount(v => v + 1);
      try { await refreshGlobalStats(); } catch {}
      try {
        trackCredentialOperation({
          operation: 'delete',
          role: 'creator',
          tokenId: item.tokenId,
          serialNumber: String(item.serialNumber || ''),
          context: 'creator_recent_activity'
        });
      } catch {}
    } catch (e) {
      alert('No se pudo borrar esta emisión.');
    }
  };

  const handleRevoke = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No hay identificadores de credencial disponibles en este elemento.');
      return;
    }
    const reason = window.prompt('Ingresa la razón de revocación (p.ej., Superseded, Compromised):', 'Superseded') || '';
    if (!reason.trim()) return;
    try {
      await apiService.revokeCredential({ tokenId: item.tokenId, serialNumber: item.serialNumber, reason });
      alert('Revocación enviada.');
      try { await refreshGlobalStats(); } catch {}
      try {
        trackCredentialOperation({
          operation: 'revoke',
          role: 'creator',
          tokenId: item.tokenId,
          serialNumber: String(item.serialNumber || ''),
          reason
        });
      } catch {}
    } catch (e) {
      alert('Error al revocar. Puede requerirse una API Key válida.');
    }
  };

  const [deletedCount, setDeletedCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({ revoked: 0, deleted: 0, verified: 0, pending: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refreshGlobalStats = useCallback(async () => {
    try {
      const s = await apiService.getCredentialStats({ scope: 'creator', issuerId: creatorProfile?.did || undefined, role: 'creator' });
      if (s && s.success) {
        setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) });
      }
    } catch {}
  }, [creatorProfile?.did]);

  useEffect(() => {
    (async () => { try { await refreshGlobalStats(); } catch {} })();
  }, [refreshGlobalStats]);

  const handleRequestVerification = async (item) => {
    if (!item?.tokenId || !item?.serialNumber) {
      alert('No hay identificadores de credencial disponibles en este elemento.');
      return;
    }
    try {
      await apiService.requestCredentialVerification({ tokenId: item.tokenId, serialNumber: item.serialNumber, role: 'creator' });
      setRecentActivity(prev => prev.map(x => (x.tokenId === item.tokenId && String(x.serialNumber) === String(item.serialNumber)) ? { ...x, status: 'pending' } : x));
      alert('Solicitud de verificación enviada. Estado: Pendiente');
      try { await refreshGlobalStats(); } catch {}
    } catch (e) {
      alert('No se pudo enviar la solicitud de verificación.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <Toaster position="top-right" />
      {/* Simulation Banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white flex justify-between items-center px-4 py-2 shadow-lg relative z-50">
        <span className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Modo Simulación • Experiencia Interactiva
        </span>
        <a href="/" className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all">
          Salir de la Demo
        </a>
      </div>

      {/* AcademicChain Branding Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 relative z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <img
                  src={toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q')}
                  alt="AcademicChain Logo"
                  className="h-10 w-10 rounded-full shadow-sm object-contain bg-white"
                />
                <div className="flex flex-col">
                   <h3 className="text-lg font-bold text-slate-900 leading-none tracking-tight">{creatorProfile.brand}</h3>
                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Impulsado por AcademicChain</p>
                </div>
             </div>
        </div>
      </div>

      {/* Premium Dark Header */}
      <div className="bg-slate-900 border-b border-cyan-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                Portal de Creadores
              </h1>
              <p className="text-slate-400 text-lg max-w-xl">
                Gestiona, emite y personaliza tus certificaciones digitales con tecnología blockchain.
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <Link to="/precios?tab=creators" className="mb-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-pink-900/20 border border-pink-500/30 transition-all hover:scale-105 flex items-center gap-2">
                <span>🚀</span> Registra tus cursos
              </Link>
              <div className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                MENTOR VERIFICADO
              </div>
              <p className="text-slate-500 mt-2 font-mono text-xs bg-black/30 px-3 py-1 rounded">
                {creatorProfile.did}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-center gap-3">
          <input
            className="input-primary w-full md:w-96"
            placeholder="Buscar por nombre, hash, tokenId, serial o id"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="input-primary w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="verified">Verificadas</option>
            <option value="pending">Pendientes</option>
            <option value="revoked">Revocadas</option>
            <option value="confirmed">Confirmadas</option>
          </select>
        </div>
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30" title="Totales (global)">
            Revocadas (Total): <strong>{globalStats.revoked}</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30" title="Totales (global)">
            Eliminadas (Total): <strong>{globalStats.deleted}</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/30" title="Totales (global)">
            Verificadas (Total): <strong>{globalStats.verified}</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" title="Totales (global)">
            Pendientes (Total): <strong>{globalStats.pending}</strong>
          </span>
        </div>

        {/* Real-time Emission Flow */}
        <div className="mb-10 bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={() => {
                        const eventData = {
                            studentName: 'Estudiante Demo ' + Math.floor(Math.random() * 1000),
                            employerName: 'Tech Corp ' + Math.floor(Math.random() * 100),
                            courseName: 'Desarrollo Blockchain Avanzado'
                        };
                        window.dispatchEvent(new CustomEvent('acl:hired', { detail: eventData }));
                        localStorage.setItem('acl:event:hired', JSON.stringify(eventData));
                        setTimeout(() => localStorage.removeItem('acl:event:hired'), 100);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center gap-2 text-xs"
                >
                    <span>🔔</span> Simular Contratación
                </button>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="text-6xl">🔗</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Flujo de Emisión en Tiempo Real
            </h3>
            <p className="text-slate-400 text-sm mb-6">Estado actual de la dispersión de certificados en la red.</p>
            <CreatorStepper currentStep={3} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-cyan-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <span className="text-4xl">📜</span>
            </div>
            <div className="text-cyan-400 text-4xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left">
              {stats.totalIssued}
            </div>
            <div className="text-slate-400 font-medium">Certificados Emitidos</div>
            <div className="text-cyan-600 text-xs mt-2 font-semibold uppercase tracking-wider">
              📜 Vidas certificadas
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <span className="text-4xl">💼</span>
            </div>
            <div className="text-blue-400 text-4xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left">
              {stats.impactoLaboral}
            </div>
            <div className="text-slate-400 font-medium">Impacto Laboral</div>
            <div className="text-blue-600 text-xs mt-2 font-semibold uppercase tracking-wider">
              👥 Alumnos Contratados
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-purple-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <span className="text-4xl">🔥</span>
            </div>
            <div className="text-purple-400 text-2xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left truncate">
              {stats.rankingSkills}
            </div>
            <div className="text-slate-400 font-medium">Top Habilidad</div>
            <div className="text-purple-600 text-xs mt-2 font-semibold uppercase tracking-wider">
              📈 Alta Demanda
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-green-500/30 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <span className="text-4xl">🛡️</span>
            </div>
            <div className="text-green-400 text-2xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left">
              {stats.uptime}
            </div>
            <div className="text-slate-400 font-medium">Uptime de Confianza</div>
            <div className="text-green-600 text-xs mt-2 font-semibold uppercase tracking-wider">
              ✅ Arkhia & MongoDB
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
              <span className="text-cyan-500">📊</span> Emisiones Mensuales
            </h3>
            <div className="h-64">
              <Bar data={monthlyData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
              <span className="text-purple-500">🍩</span> Distribución por Tipo
            </h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={typeDistribution} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Issuance Component */}
          <div className="lg:col-span-2">
             <CreatorIssuance />
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
              <span className="text-blue-500">⚡</span> Actividad Reciente
            </h3>
            <div className="space-y-4">
              {(searchQuery ? recentActivity.filter(x => {
                const q = String(searchQuery || '').toLowerCase().trim();
                const name = String(x.studentName || '').toLowerCase();
                const type = String(x.credentialType || '').toLowerCase();
                const tokenId = String(x.tokenId || x.id || '').toLowerCase();
                const serial = String(x.serialNumber || '').toLowerCase();
                const hash = String(x.uniqueHash || '').toLowerCase();
                const ipfs = String(x.ipfsURI || '').toLowerCase();
                const hederaTx = String(x.externalProofs?.hederaTx || '').toLowerCase();
                const xrpTx = String(x.externalProofs?.xrpTxHash || '').toLowerCase();
                const algoTx = String(x.externalProofs?.algoTxId || '').toLowerCase();
                const match = [name, type, tokenId, serial, hash, ipfs, hederaTx, xrpTx, algoTx].some(v => v.includes(q));
                if (!match) return false;
                const st = String(x.status || '').toLowerCase();
                if (statusFilter === 'all') return true;
                if (statusFilter === 'verified') return st === 'verified';
                if (statusFilter === 'pending') return st === 'pending';
                if (statusFilter === 'revoked') return st === 'revoked';
                if (statusFilter === 'confirmed') return st && st !== 'verified' && st !== 'pending' && st !== 'revoked';
                return true;
              }) : recentActivity.filter(x => {
                const st = String(x.status || '').toLowerCase();
                if (statusFilter === 'all') return true;
                if (statusFilter === 'verified') return st === 'verified';
                if (statusFilter === 'pending') return st === 'pending';
                if (statusFilter === 'revoked') return st === 'revoked';
                if (statusFilter === 'confirmed') return st && st !== 'verified' && st !== 'pending' && st !== 'revoked';
                return true;
              })).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700 group">
                  <div className="bg-cyan-500/10 text-cyan-400 p-2 rounded-full group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <span className="text-xl">🎓</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{activity.studentName}</div>
                    <div className="text-sm text-slate-400">{activity.credentialType}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {new Date(activity.issuedAt).toLocaleDateString()}
                    </div>
                    {activity.tokenId && activity.serialNumber && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${
                          String(activity.status || '').toLowerCase() === 'revoked'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : String(activity.status || '') === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          {String(activity.status || '').toLowerCase() === 'revoked' ? 'Revocada' : (activity.status === 'verified' ? 'Verificado' : (activity.status === 'pending' ? 'Pendiente' : 'Confirmado'))}
                        </span>

                        <button className="btn-secondary btn-sm text-red-400 border-red-400/40 hover:bg-red-500/10" onClick={() => handleRevoke(activity)}>Revocar</button>
                        <button className="btn-secondary btn-sm text-red-400 border-red-400/40 hover:bg-red-500/10" onClick={() => handleDelete(activity)}>Borrar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(searchQuery ? recentActivity.filter(x => {
                const q = String(searchQuery || '').toLowerCase().trim();
                const fields = [
                  String(x.studentName || '').toLowerCase(),
                  String(x.credentialType || '').toLowerCase(),
                  String(x.tokenId || x.id || '').toLowerCase(),
                  String(x.serialNumber || '').toLowerCase(),
                  String(x.uniqueHash || '').toLowerCase(),
                  String(x.ipfsURI || '').toLowerCase(),
                  String(x.externalProofs?.hederaTx || '').toLowerCase(),
                  String(x.externalProofs?.xrpTxHash || '').toLowerCase(),
                  String(x.externalProofs?.algoTxId || '').toLowerCase()
                ];
                return fields.some(v => v.includes(q));
              }) : recentActivity).length === 0 && (
                <div className="text-slate-500 text-center py-8">No hay actividad reciente.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;

