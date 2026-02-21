import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ConnectionService from './services/connectionService';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import demoService from './services/demoService';
import useHedera from './useHedera';
import { useAuth } from './useAuth';
import { issuanceService } from './services/issuanceService';
import { institutionService } from './services/institutionService';
import { toGateway, getGateways } from './utils/ipfsUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { theme } from './themeConfig';
import jsPDF from 'jspdf';
import CreditRecharge from './CreditRecharge';
import CertificateDesigner from './CertificateDesigner';
import NarrativeTemplateManager from './NarrativeTemplateManager';
import { Toaster, toast } from 'react-hot-toast';
import CyberBackground from './CyberBackground';
import InstitutionAnalytics from './InstitutionAnalytics';
import InstitutionSubscriptionModal from './InstitutionSubscriptionModal';
import n8nService from './services/n8nService';

// Plan Definitions
const PLANS = {
  esencial: {
    id: 'esencial',
    name: 'Plan Esencial',
    limit: 50,
    networks: ['hedera'],
    analytics: 'basic',
    price: 50
  },
  professional: {
    id: 'professional',
    name: 'Plan Profesional',
    limit: 220,
    networks: ['hedera', 'xrp'],
    analytics: 'advanced',
    price: 155
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise',
    limit: Infinity,
    networks: ['hedera', 'xrp', 'algorand'],
    analytics: 'advanced',
    price: 'custom'
  }
};

function EnhancedInstitutionDashboard({ demo = false }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('emitir'); // 'emitir' | 'masiva' | 'credenciales' | 'designer' | 'recargar'
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [aclBalance, setAclBalance] = useState(5000);
  
  // Branding State
  const [institutionName, setInstitutionName] = useState('Mi Universidad');
  const [institutionLogo, setInstitutionLogo] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('acl:brand:name');
    const savedLogo = localStorage.getItem('acl:brand:logo');
    if (savedName) setInstitutionName(savedName);
    if (savedLogo) setInstitutionLogo(savedLogo);
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInstitutionLogo(reader.result);
        localStorage.setItem('acl:brand:logo', reader.result);
        toast.success('Logo actualizado');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    localStorage.setItem('acl:brand:name', institutionName);
    toast.success('Nombre actualizado');
  };

  
  // Plan State
  const [currentPlan, setCurrentPlan] = useState(PLANS.esencial); // Default to Esencial as per user request
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [emissionsUsed, setEmissionsUsed] = useState(0);
  const [selectedNetworks, setSelectedNetworks] = useState(PLANS.professional.networks);

  useEffect(() => {
    if (currentPlan) {
        setSelectedNetworks(currentPlan.networks);
    }
  }, [currentPlan]);



  const [stats, setStats] = useState({
    totalCredentials: 0,
    totalTokens: 0,
    totalRecipients: 0
  });
  const [credentials, setCredentials] = useState([]);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [selectedCred, setSelectedCred] = useState(null);
  const [globalStats, setGlobalStats] = useState({ revoked: 0, deleted: 0, verified: 0, pending: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Plan Details
        const planData = await n8nService.getInstitutionPlan('inst-123');
        setCurrentPlan(planData.details);
        setEmissionsUsed(planData.emissionsUsed);
        setSelectedNetworks(planData.details.networks);

        // Intentar cargar datos reales si hay token
        if (token && !demo) {
             try {
                 const creds = await institutionService.getIssuedCredentials(token);
                 setCredentials(creds || []);
                 setStats({
                    totalCredentials: creds.length,
                    totalTokens: new Set(creds.map(c => c.tokenId)).size,
                    totalRecipients: new Set(creds.map(c => c.studentId)).size
                 });
             } catch (err) {
                 console.warn("Could not fetch real data, using fallback", err);
                 // Fallback mock data to prevent empty dashboard
                 setCredentials([
                    { studentName: 'Estudiante Demo', title: 'Certificado de Prueba', id: '0.0.12345', status: 'confirmed' }
                 ]);
             }
        } else {
            // Mock data for demo mode
            await new Promise(r => setTimeout(r, 800)); // Simulate network
            setStats({ totalCredentials: 1240, totalTokens: 3, totalRecipients: 850 });
            setCredentials([
                { studentName: 'Ana García', title: 'Ingeniería de Software', id: '0.0.123456', status: 'confirmed' },
                { studentName: 'Carlos López', title: 'Arquitectura', id: '0.0.789012', status: 'confirmed' },
                { studentName: 'Maria Rodriguez', title: 'Master en Data Science', id: '0.0.456789', status: 'confirmed' }
            ]);
        }
        try {
          const issuerId = String(user?.id || user?.universityId || '');
          const s = await n8nService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' });
          if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) });
        } catch {}
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Error cargando el dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, demo]);

  const handleSubscribe = async (planId) => {
    toast.loading("Actualizando plan institucional...");
    try {
        const result = await n8nService.upgradePlan(planId);
        if (result.success) {
            setCurrentPlan(result.plan);
            setSelectedNetworks(result.plan.networks);
            setShowPlanModal(false);
            toast.dismiss();
            toast.success(`¡Plan actualizado a ${result.plan.name}!`);
        }
    } catch (error) {
        toast.error("Error al actualizar plan");
    }
  };

  useEffect(() => {
    // Simulate High Demand Notification
    if (!demo && !loading) {
        const timer = setTimeout(() => {
            toast((t) => (
                <div className="flex items-start gap-3 max-w-sm">
                    <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400">
                        <span className="text-xl">🔥</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Alta Demanda Detectada</h4>
                        <p className="text-xs text-slate-300 mt-1">
                            Anglo American ha validado 50 certificados de "Seguridad Minera" en la última hora.
                        </p>
                        <button 
                            onClick={() => { setActiveTab('analiticas'); toast.dismiss(t.id); }}
                            className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300"
                        >
                            Ver Análisis de Mercado →
                        </button>
                    </div>
                </div>
            ), { duration: 8000, style: { border: '1px solid rgba(249, 115, 22, 0.3)', background: 'rgba(15, 23, 42, 0.95)' } });
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [loading, demo]);

  const renderConnectionStatus = () => (
    <div className="flex items-center gap-2 mt-1">
      <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
      <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">{connectionStatus}</span>
    </div>
  );

  const renderLimitBanner = () => {
    if (currentPlan?.limit !== Infinity && emissionsUsed >= currentPlan?.limit) {
      return (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-500/20 rounded-full text-red-400">
                <span className="text-xl">🛑</span>
             </div>
             <div>
                <h4 className="text-white font-bold">Límite de Emisiones Alcanzado</h4>
                <p className="text-slate-400 text-sm">Has alcanzado el límite de {currentPlan.limit} títulos de tu Plan {currentPlan.name}.</p>
             </div>
          </div>
          <button 
             onClick={() => setShowPlanModal(true)}
             className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg"
          >
             Mejorar a Profesional ⚡
          </button>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'masiva':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
            {renderLimitBanner()}
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-cyan-400">📚</span> Emisión Masiva
              <span className={`text-xs px-2 py-1 rounded-full border ${currentPlan?.limit === Infinity ? 'border-pink-500 text-pink-400' : 'border-slate-500 text-slate-400'}`}>
                {currentPlan?.limit === Infinity ? 'Ilimitado' : `${emissionsUsed} / ${currentPlan?.limit} Títulos`}
              </span>
            </h2>
            <BatchIssuance demo={demo} plan={currentPlan} />
          </motion.div>
        );
      case 'designer':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <CertificateDesigner 
                onClose={() => setActiveTab('emitir')} 
                onSave={() => { toast.success('Diseño guardado'); setActiveTab('emitir'); }} 
                onNavigate={(tab) => setActiveTab(tab)}
             />
          </motion.div>
        );
      case 'narrativas':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-140px)]">
            <NarrativeTemplateManager />
          </motion.div>
        );
      case 'analiticas':
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <InstitutionAnalytics plan={currentPlan} onUpgrade={() => setShowPlanModal(true)} />
            </motion.div>
        );
      case 'recargar':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CreditRecharge />
          </motion.div>
        );
      case 'credenciales':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">Historial Completo de Emisiones</h3>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs">Exportar CSV</button>
                <button className="btn-primary text-xs" onClick={() => setActiveTab('emitir')}>Nueva Emisión</button>
              </div>
            </div>
            <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-800/60">
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
              <input
                className="input-primary ml-auto w-72"
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Estudiante</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">ID Transacción</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(searchQuery ? credentials.filter(x => {
                    const q = String(searchQuery || '').toLowerCase().trim();
                    const fields = [
                      String(x.studentName || '').toLowerCase(),
                      String(x.title || '').toLowerCase(),
                      String(x.tokenId || x.id || '').toLowerCase(),
                      String(x.serialNumber || '').toLowerCase(),
                      String(x.uniqueHash || '').toLowerCase(),
                      String(x.ipfsURI || '').toLowerCase(),
                      String(x.externalProofs?.hederaTx || '').toLowerCase(),
                      String(x.externalProofs?.xrpTxHash || '').toLowerCase(),
                      String(x.externalProofs?.algoTxId || '').toLowerCase()
                    ];
                    const match = fields.some(v => v.includes(q));
                    if (!match) return false;
                    const st = String(x.status || '').toLowerCase();
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'verified') return st === 'verified';
                    if (statusFilter === 'pending') return st === 'pending';
                    if (statusFilter === 'revoked') return st === 'revoked';
                    if (statusFilter === 'confirmed') return st && st !== 'verified' && st !== 'pending' && st !== 'revoked';
                    return true;
                  }) : credentials.filter(x => {
                    const st = String(x.status || '').toLowerCase();
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'verified') return st === 'verified';
                    if (statusFilter === 'pending') return st === 'pending';
                    if (statusFilter === 'revoked') return st === 'revoked';
                    if (statusFilter === 'confirmed') return st && st !== 'verified' && st !== 'pending' && st !== 'revoked';
                    return true;
                  })).map((cred, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{cred.studentName || 'Anon'}</td>
                      <td className="px-6 py-4 text-slate-300">{cred.title}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{cred.id || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-400">{cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : 'Hoy'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                          String(cred.status || '').toLowerCase() === 'revoked'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : String(cred.status || '') === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          {String(cred.status || '').toLowerCase() === 'revoked' ? 'Revocada' : (cred.status === 'verified' ? 'Verificado' : (cred.status === 'pending' ? 'Pendiente' : 'Confirmado'))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {cred.status !== 'verified' && (
                            <button
                              className="btn-secondary btn-sm border-green-400/40 text-green-400 hover:bg-green-500/10"
                              onClick={async () => {
                                await n8nService.requestCredentialVerification({ tokenId: cred.tokenId || cred.id, serialNumber: String(cred.serialNumber || 1), role: 'institution' });
                                setCredentials(prev => prev.map(c => (c === cred) ? { ...c, status: 'pending' } : c));
                                try { 
                                  let issuerId = ''; 
                                  try { issuerId = String(user?.id || user?.universityId || ''); } catch {} 
                                  await n8nService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' }).then(s => { 
                                    if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) }); 
                                  }); 
                                } catch {}
                                alert('Solicitud de verificación enviada a n8n. Estado: Pendiente');
                              }}
                            >
                              Solicitar verificación
                            </button>
                          )}
                          <button
                            className="btn-secondary btn-sm text-red-400 border-red-400/40 hover:bg-red-500/10"
                            onClick={() => { setSelectedCred(cred); setRevokeReason(''); setRevokeOpen(true); }}
                          >
                            Revocar
                          </button>
                          <button
                            className="btn-secondary btn-sm text-red-400 border-red-400/40 hover:bg-red-500/10"
                            onClick={async () => {
                              await n8nService.deleteCredential({ tokenId: cred.tokenId || cred.id, serialNumber: String(cred.serialNumber || 1) });
                              setCredentials(prev => prev.filter(c => c !== cred));
                              try { 
                                let issuerId = ''; 
                                try { issuerId = String(user?.id || user?.universityId || ''); } catch {} 
                                await n8nService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' }).then(s => { 
                                  if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) }); 
                                }); 
                              } catch {}
                            }}
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {credentials.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        No hay credenciales emitidas aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {revokeOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40" onClick={() => setRevokeOpen(false)} />
                <div className="relative bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Revocar Credencial</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    ID <span className="font-mono">{selectedCred?.id || selectedCred?.tokenId}</span>
                  </p>
                  <div className="form-control mb-3">
                    <label className="label-text">Razón</label>
                    <select className="input-primary" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}>
                      <option value="">Selecciona una razón...</option>
                      <option value="PrivilegeWithdrawn">Privilegio Retirado</option>
                      <option value="CessationOfOperation">Cese de Operaciones</option>
                      <option value="AffiliationChanged">Cambio de Afiliación</option>
                      <option value="Superseded">Reemplazada</option>
                      <option value="Compromised">Comprometida</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost" onClick={() => setRevokeOpen(false)}>Cancelar</button>
                    <button
                      className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 text-white"
                      disabled={!revokeReason}
                      onClick={async () => {
                        await n8nService.revokeCredential({ tokenId: selectedCred?.tokenId || selectedCred?.id, serialNumber: String(selectedCred?.serialNumber || 1), reason: revokeReason });
                        setRevokeOpen(false);
                          try { 
                            let issuerId = ''; 
                            try { issuerId = String(user?.id || user?.universityId || ''); } catch {} 
                            await n8nService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' }).then(s => { 
                              if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) }); 
                            }); 
                          } catch {}
                      }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      case 'emitir':
      default:
        return (
          <>
            {renderLimitBanner()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Form */}
              <div>
                <div className="glass-panel p-1 rounded-xl">
                  <IssueTitleForm 
                    demo={demo || connectionStatus === 'demo'} 
                    networks={selectedNetworks} 
                    plan={currentPlan}
                    emissionsUsed={emissionsUsed}
                    onEmissionComplete={(count) => {
                      setEmissionsUsed(prev => prev + count);
                      (async () => {
                        try {
                          const issuerId = String(user?.id || user?.universityId || '');
                          const s = await n8nService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' });
                          if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) });
                        } catch {}
                      })();
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Quick Actions & Batch */}
              <div className="space-y-6">
                <div 
                  className="glass-card p-6 relative overflow-hidden group cursor-pointer"
                  onClick={() => setActiveTab('masiva')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                      <span className="text-cyan-400 text-xl animate-pulse">⚡</span>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Emisión Masiva</span>
                    </h3>
                    <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-all bg-black/40 backdrop-blur-sm group-hover:bg-black/60">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all duration-300">
                        <span className="text-3xl">📄</span>
                      </div>
                      <p className="text-slate-200 font-medium mb-1">Arrastra PDF o Excel aquí</p>
                      <p className="text-xs text-slate-500 mb-4">Certificación instantánea en lote</p>
                      <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-600 hover:border-cyan-500 transition-all shadow-lg hover:shadow-cyan-500/20">
                        Ir a Emisión Masiva
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-all group"
                    onClick={() => setActiveTab('narrativas')}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                        <span className="text-xl">📖</span>
                      </div>
                      <h3 className="font-bold text-white text-sm">Narrativas</h3>
                    </div>
                    <p className="text-xs text-slate-400">Configura relatos y mensajes personalizados.</p>
                  </div>

                  <div 
                    className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-all group"
                    onClick={() => setActiveTab('designer')}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 group-hover:scale-110 transition-transform">
                        <span className="text-xl">🎨</span>
                      </div>
                      <h3 className="font-bold text-white text-sm">Studio</h3>
                    </div>
                    <p className="text-xs text-slate-400">Diseña diplomas y certificados holográficos.</p>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold mb-4 text-white">Acciones Rápidas</h3>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-200 border border-slate-600 transition-colors" onClick={() => setActiveTab('designer')}>Diseñar Nuevo Título</button>
                    <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-200 border border-slate-600 transition-colors" onClick={() => setActiveTab('recargar')}>Recargar Saldo</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#030014]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 shadow-neon-blue"></div></div>;

  return (
    <div className="h-screen text-slate-100 flex overflow-hidden relative font-sans selection:bg-cyan-500/30">
      <CyberBackground />
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid rgba(51, 65, 85, 0.5)', backdropFilter: 'blur(10px)' } }} />


      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed md:static top-0 left-0 h-full w-64 z-50 glass-panel border-r border-slate-700/50 flex flex-col flex-shrink-0 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300`}
      >
        {/* AcademicChain Branding Header - Matching Global Header Style */}
        <div className="py-4 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
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
        </div>

        <div className="p-6 border-b border-slate-700/50">
          {/* Institution Branding */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group w-24 h-24 mb-3">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/10">
                {institutionLogo ? (
                  <img src={institutionLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏛️</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs font-bold text-white">Cambiar</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            
            {isEditingName ? (
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="bg-slate-800 border border-slate-600 text-white text-center rounded px-2 py-1 w-full text-sm font-bold focus:border-cyan-500 outline-none"
                autoFocus
              />
            ) : (
              <div 
                className="group flex items-center gap-2 cursor-pointer"
                onClick={() => setIsEditingName(true)}
              >
                <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{institutionName}</h2>
                <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Institución Verificada</p>
          </div>

          {/* Plan Info */}
          <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setShowPlanModal(true)}>
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentPlan?.id === 'enterprise' ? 'bg-pink-500 animate-pulse' : 'bg-blue-500'}`}></span>
                <p className="text-xs text-slate-300 font-bold uppercase">{currentPlan?.name || 'Cargando...'}</p>
             </div>
             <span className="text-[10px] text-cyan-400 hover:underline">Gestionar</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'emitir', label: 'Emitir Credencial', icon: '⚡' },
            { id: 'masiva', label: 'Emisión Masiva', icon: '📚' },
            { id: 'credenciales', label: 'Historial', icon: 'clock' },
            { id: 'designer', label: 'Diseñador Holográfico', icon: '🎨', color: 'text-purple-400' },
            { id: 'analiticas', label: 'Mercado & Impacto', icon: '📈', color: 'text-pink-400' },
            { id: 'recargar', label: 'Recargar Gas', icon: '⛽', color: 'text-green-400' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors ${activeTab === item.id ? 'bg-white/10 border border-white/10 shadow-neon-blue' : ''} ${item.color || 'text-slate-300'}`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-black/20">
          <div className="text-xs font-mono text-slate-500 mb-2">NETWORK STATUS</div>
          <div className="space-y-2">
            {selectedNetworks.map(net => (
              <div key={net} className="flex justify-between items-center text-xs">
                <span className="uppercase">{net}</span>
                <span className="text-green-400">● LIVE</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-y-auto h-full">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-slate-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-300" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard Institucional</h1>
              {renderConnectionStatus()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {demo && (
              <Link to="/" className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors">
                Salir de la Demo
              </Link>
            )}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">Balance ACL</span>
              <span className="text-xs font-mono text-primary-400">{aclBalance} CREDITS</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
              <div className="h-full w-full rounded-full bg-black flex items-center justify-center font-bold text-white text-xs">
                INS
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Credenciales Emitidas', value: stats?.totalCredentials || 1240, color: 'from-blue-500 to-cyan-500' },
              { label: 'Tokens Activos', value: stats?.totalTokens || 3, color: 'from-purple-500 to-pink-500' },
              { label: 'Destinatarios', value: stats?.totalRecipients || 850, color: 'from-green-500 to-emerald-500' },
              { label: 'Integridad', value: '100%', color: 'from-orange-500 to-red-500' }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-10 -mt-10 blur-xl group-hover:opacity-20 transition-opacity`}></div>
                <div className="text-sm text-slate-400">{stat.label}</div>
                <div className="text-2xl font-bold font-display mt-1">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
            >
                {renderContent()}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showPlanModal && (
            <InstitutionSubscriptionModal 
                onClose={() => setShowPlanModal(false)} 
                currentPlanId={currentPlan?.id}
                onSubscribe={handleSubscribe}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedInstitutionDashboard;
