import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ConnectionService from './services/connectionService';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import demoService from './services/demoService';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { issuanceService } from './services/issuanceService';
import { toGateway, getGateways } from './utils/ipfsUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hexagon, 
  LayoutDashboard, 
  PenTool, 
  Zap, 
  Layers, 
  History, 
  BarChart3, 
  CreditCard, 
  Globe, 
  Shield, 
  LogOut, 
  Menu, 
  Search, 
  FileText, 
  Trash2, 
  XCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  X,
  Settings,
  ChevronRight,
  Upload,
  User,
  MoreVertical
} from 'lucide-react';
import { theme } from './themeConfig';
import jsPDF from 'jspdf';
import CreditRecharge from './CreditRecharge';
import CertificateDesigner from './CertificateDesigner';
import CertificationStepper from './CertificationStepper';
import NarrativeTemplateManager from './NarrativeTemplateManager';
import { Toaster, toast } from 'react-hot-toast';
import InstitutionAnalytics from './InstitutionAnalytics';
import InstitutionSubscriptionModal from './InstitutionSubscriptionModal';
import apiService from './services/apiService';
import DocumentViewer from './ui/DocumentViewer';
import LiveBlockVisualizer from './LiveBlockVisualizer';

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
  const [activeTab, setActiveTab] = useState('emitir'); 
  const [isEditingDesign, setIsEditingDesign] = useState(true);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('institution:step');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('institution:step', currentStep);
  }, [currentStep]);

  // Sync isEditingDesign with step
  useEffect(() => {
    if (currentStep === 1) setIsEditingDesign(true);
    else setIsEditingDesign(false);
  }, [currentStep]);

  const [issuanceMode, setIssuanceMode] = useState('individual'); // 'individual' | 'mass'
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [aclBalance, setAclBalance] = useState(5000);
  
  // Branding State
  const [institutionName, setInstitutionName] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('acl:brand:name');
        if (saved && saved !== 'Academic Chain Institute') return saved;
    }
    return 'AcademicChain Ledger';
  });
  const [institutionLogo, setInstitutionLogo] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedDesign, setSavedDesign] = useState(null);
  const [activeDesignFile, setActiveDesignFile] = useState(null);

  useEffect(() => {
    if (savedDesign?.file) {
      setActiveDesignFile(savedDesign.file);
    }
  }, [savedDesign]);

  useEffect(() => {
    // Sync with User Profile
    if (user?.name || user?.institutionName) {
        if (user.id === '444' || user.institutionName === 'AcademicChain Ledger' || user.name === '444') {
             setInstitutionName('AcademicChain Ledger');
             localStorage.setItem('acl:brand:name', 'AcademicChain Ledger');
        } else {
             const savedName = localStorage.getItem('acl:brand:name');
             if (savedName && savedName !== 'Academic Chain Institute') {
                 setInstitutionName(savedName);
             } else {
                 setInstitutionName(user.institutionName || user.name);
             }
        }
    } else {
        const savedName = localStorage.getItem('acl:brand:name');
        const savedLogo = localStorage.getItem('acl:brand:logo');
        if (savedName) setInstitutionName(savedName);
        if (savedLogo) setInstitutionLogo(savedLogo);
    }
  }, [user]);

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
  const [currentPlan, setCurrentPlan] = useState(PLANS.esencial);
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
  const [docOpen, setDocOpen] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docMetadata, setDocMetadata] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const planData = await apiService.getInstitutionPlan(String(user?.id || user?.universityId || 'inst-123'));
        if (planData?.details) {
            setCurrentPlan(planData.details);
            setSelectedNetworks(planData.details.networks || ['hedera']);
        }
        if (planData?.emissionsUsed !== undefined) {
            setEmissionsUsed(planData.emissionsUsed);
        }

        if (token && !demo) {
             try {
                const issuerId = String(user?.id || user?.universityId || 'inst-123');
                const creds = await apiService.getInstitutionCredentials(issuerId);
                 const localCredsRaw = localStorage.getItem('acl:credentials');
                 const localCreds = localCredsRaw ? JSON.parse(localCredsRaw) : [];
                 
                 const allCreds = [...(Array.isArray(creds) ? creds : []), ...localCreds];
                 const uniqueCreds = Array.from(new Map(allCreds.map(item => [item.id || item.tokenId, item])).values());

                 const normalized = uniqueCreds.map(c => ({
                   ...c,
                   title: c.title || c.degree || c.courseName || c.metadata?.degree || 'Título',
                   type: c.type || c.credentialType || 'titulo',
                   ipfsHash256: c.ipfsHash256 || c.metadata?.ipfsHash256 || c.metadata?.sha256,
                   ipfsCid: c.ipfsCid || c.metadata?.ipfsCid,
                   encryptedCid: c.encryptedCid || c.metadata?.encryptedCid,
                   hederaTxId: c.hederaTxId || c.metadata?.hederaTxId || c.externalProofs?.hederaTx,
                   xrpHash: c.xrpHash || c.metadata?.xrpHash || c.externalProofs?.xrpTxHash,
                   algorandHash: c.algorandHash || c.metadata?.algorandHash || c.externalProofs?.algoTxId,
                   id: c.hederaId || c.metadata?.hederaId || c.id || c.tokenId
                 }));
                 const ordered = [...normalized].sort((a, b) => {
                   const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                   const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                   return db - da;
                 });
                 setCredentials(ordered);
                 setStats({
                    totalCredentials: creds.length,
                    totalTokens: new Set(creds.map(c => c.tokenId)).size,
                    totalRecipients: new Set(creds.map(c => c.studentId)).size
                 });
             } catch (err) {
                 console.warn("Could not fetch real data, using fallback", err);
                 setCredentials([
                    { studentName: 'Estudiante Demo', title: 'Título de Prueba', id: '0.0.12345', status: 'confirmed', type: 'titulo' }
                 ]);
             }
        } else {
            await new Promise(r => setTimeout(r, 800));
            const localCredsRaw = localStorage.getItem('acl:credentials');
            const localCreds = localCredsRaw ? JSON.parse(localCredsRaw) : [];
            const demoCredentials = [
                { 
                  studentName: 'Ana García', 
                  title: 'Título: Ingeniería de Software', 
                  id: '0.0.123456', 
                  status: 'confirmed', 
                  type: 'titulo', 
                  createdAt: new Date().toISOString(),
                  ipfsCid: 'QmXyZ12345abcde67890fghij12345klmno67890pqrs',
                  encryptedCid: 'U2FsdGVkX1+...', 
                  ipfsHash256: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
                  hederaTxId: '0.0.123456@1709876543.123456',
                  xrpHash: null,
                  algorandHash: null,
                  ipfsURI: 'ipfs://QmXyZ12345abcde67890fghij12345klmno67890pqrs',
                  networkType: 'single'
                },
                { 
                  studentName: 'Carlos López', 
                  title: 'Título: Arquitectura', 
                  id: '0.0.789012', 
                  status: 'confirmed', 
                  type: 'titulo', 
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                  ipfsCid: 'QmAbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf',
                  encryptedCid: 'U2FsdGVkX1/abcdef...',
                  ipfsHash256: 'f1e2d3c4b5a697887766554433221100f1e2d3c4b5a697887766554433221100',
                  hederaTxId: '0.0.789012@1709790143.654321',
                  xrpHash: 'X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1',
                  algorandHash: null,
                  ipfsURI: 'ipfs://QmAbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf',
                  networkType: 'dual'
                },
                { 
                  studentName: 'Maria Rodriguez', 
                  title: 'Título: Master en Data Science', 
                  id: '0.0.456789', 
                  status: 'confirmed', 
                  type: 'titulo', 
                  createdAt: new Date(Date.now() - 2*86400000).toISOString(),
                  ipfsCid: 'Qm1234567890abcdef1234567890abcdef1234567890',
                  encryptedCid: 'U2FsdGVkX1+987654...',
                  ipfsHash256: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
                  hederaTxId: '0.0.456789@1709703743.987654',
                  xrpHash: 'R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0',
                  algorandHash: 'G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4',
                  ipfsURI: 'ipfs://Qm1234567890abcdef1234567890abcdef1234567890',
                  networkType: 'triple'
                }
            ];
            const combined = [...localCreds, ...demoCredentials];
            const uniqueCombined = Array.from(new Map(combined.map(item => [item.id || item.tokenId, item])).values());
            setStats({ totalCredentials: 1240 + localCreds.length, totalTokens: 3 + localCreds.length, totalRecipients: 850 + localCreds.length });
            setCredentials(uniqueCombined);
        }
        try {
          const issuerId = String(user?.id || user?.universityId || '');
          const s = await apiService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' });
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
        const result = await apiService.upgradePlan(planId);
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

  const handleExportCSV = () => {
    const dataToExport = credentials;
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = [
      "Estudiante", "Título", "Fecha Emisión", "Hedera Creation ID (TxID)", 
      "Token ID", "CID (IPFS)", "CID Cifrado (AES)", "Hash Documento (SHA-256)", 
      "XRP Ledger Hash", "Algorand Hash", "Estado"
    ];

    const rows = dataToExport.map(cred => [
      cred.studentName || "N/A",
      cred.title || "N/A",
      cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : "N/A",
      cred.hederaTxId || cred.externalProofs?.hederaTx || "N/A",
      cred.id || cred.tokenId || "N/A",
      cred.ipfsCid || (cred.ipfsURI ? cred.ipfsURI.replace("ipfs://", "") : "N/A"),
      cred.encryptedCid || "N/A",
      cred.ipfsHash256 || cred.metadata?.ipfsHash256 || "N/A",
      cred.xrpHash || cred.externalProofs?.xrpTxHash || "N/A",
      cred.algorandHash || cred.externalProofs?.algoTxId || "N/A",
      cred.status || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `emisiones_academicchain_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportación CSV completada");
  };

  const renderLimitBanner = () => {
    if (currentPlan?.limit !== Infinity && emissionsUsed >= currentPlan?.limit) {
      return (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-500/20 rounded-full text-red-400">
                <AlertTriangle size={24} strokeWidth={1} />
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
            {renderLimitBanner()}
            <h2 className="text-5xl font-black tracking-tighter mb-8 flex items-center gap-4 text-white">
              <Layers size={48} className="text-emerald-500" strokeWidth={1} /> 
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">Emisión Masiva</span>
              <span className={`text-base font-normal px-3 py-1 rounded-full border ml-4 ${currentPlan?.limit === Infinity ? 'border-pink-500 text-pink-400' : 'border-slate-500 text-slate-400'}`}>
                {currentPlan?.limit === Infinity ? 'Ilimitado' : `${emissionsUsed} / ${currentPlan?.limit} Títulos`}
              </span>
            </h2>
            <BatchIssuance 
              demo={demo} 
              plan={currentPlan} 
              emissionsUsed={emissionsUsed}
              onEmissionComplete={(count) => setEmissionsUsed(prev => prev + count)}
              institutionName={institutionName}
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
      case 'credenciales': {
        const filteredCredentials = (searchQuery ? credentials.filter(x => {
          const q = String(searchQuery || '').toLowerCase().trim();
          const fields = [
            String(x.studentName || '').toLowerCase(),
            String(x.title || '').toLowerCase(),
            String(x.tokenId || x.id || '').toLowerCase(),
            String(x.serialNumber || '').toLowerCase(),
            String(x.uniqueHash || '').toLowerCase(),
            String(x.ipfsHash256 || '').toLowerCase(),
            String(x.ipfsURI || '').toLowerCase(),
            String(x.externalProofs?.hederaTx || '').toLowerCase(),
            String(x.externalProofs?.xrpTxHash || '').toLowerCase(),
            String(x.externalProofs?.algoTxId || '').toLowerCase()
          ];
          return fields.some(v => v.includes(q));
        }) : credentials).filter(x => {
          const st = String(x.status || '').toLowerCase();
          const tp = String(x.type || x.credentialType || '').toLowerCase();
          if (statusFilter !== 'all') {
            if (statusFilter === 'verified' && st !== 'verified') return false;
            if (statusFilter === 'pending' && st !== 'pending') return false;
            if (statusFilter === 'revoked' && st !== 'revoked') return false;
            if (statusFilter === 'confirmed' && (st === 'verified' || st === 'pending' || st === 'revoked')) return false;
          }
          if (typeFilter !== 'all') {
            if (typeFilter === 'titulo' && tp !== 'titulo' && tp !== 'degree') return false;
            if (typeFilter === 'certificado' && !tp.includes('cert')) return false;
            if (typeFilter === 'otro' && (tp === 'titulo' || tp.includes('cert'))) return false;
          }
          return true;
        });

        const orderedCredentials = [...filteredCredentials].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-3xl font-black tracking-tighter text-white">Historial Completo</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors" onClick={handleExportCSV}>
                    <Download size={16} strokeWidth={1} /> Exportar CSV
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors border border-emerald-500/20" onClick={() => setActiveTab('emitir')}>
                    <Zap size={16} strokeWidth={1} /> Nueva Emisión
                </button>
              </div>
            </div>
            <div className="px-8 py-4 flex flex-wrap items-center gap-4 border-b border-white/5 bg-black/20">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium" title="Totales (global)">
                Revocadas: <strong>{globalStats.revoked}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium" title="Totales (global)">
                Eliminadas: <strong>{globalStats.deleted}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium" title="Totales (global)">
                Verificadas: <strong>{globalStats.verified}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium" title="Totales (global)">
                Pendientes: <strong>{globalStats.pending}</strong>
              </span>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} strokeWidth={1} />
                    <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="Buscar por nombre, hash, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              </div>
              <select className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-white/20" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Estado: Todas</option>
                <option value="verified">Solo verificadas</option>
                <option value="pending">Solo pendientes</option>
                <option value="revoked">Solo revocadas</option>
                <option value="confirmed">Solo confirmadas</option>
              </select>
              <select className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-white/20" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Tipo: Todos</option>
                <option value="titulo">Solo títulos</option>
                <option value="certificado">Solo certificados</option>
                <option value="otro">Otros</option>
              </select>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4">Estudiante</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4 hidden md:table-cell">ID Transacción</th>
                    <th className="px-6 py-4 hidden md:table-cell">Tipo</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orderedCredentials.map((cred, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white">{cred.studentName || 'Anon'}</td>
                      <td className="px-6 py-4 text-slate-300">{cred.title}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 hidden md:table-cell group-hover:text-slate-400 transition-colors">{cred.id || 'N/A'}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border border-white/10 text-slate-300 bg-white/5">
                          {String(cred.type || 'titulo').toLowerCase().includes('cert') ? 'Certificado' : 'Título'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : 'Hoy'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                          String(cred.status || '').toLowerCase() === 'revoked'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : String(cred.status || '') === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {String(cred.status || '').toLowerCase() === 'revoked' ? 'Revocada' : (cred.status === 'verified' ? 'Verificado' : (cred.status === 'pending' ? 'Pendiente' : 'Confirmado'))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Ver documento"
                            onClick={() => {
                              const url = toGateway(cred.ipfsURI);
                              if (!url) {
                                toast.error('Este registro aún no tiene documento en IPFS');
                                return;
                              }
                              setDocUrl(url);
                              setDocMetadata(cred);
                              setDocOpen(true);
                            }}
                          >
                            <Eye size={16} strokeWidth={1} />
                          </button>
                          <button
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="Revocar"
                            onClick={() => { setSelectedCred(cred); setRevokeReason(''); setRevokeOpen(true); }}
                          >
                            <XCircle size={16} strokeWidth={1} />
                          </button>
                          <button
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Borrar"
                            onClick={async () => {
                              await apiService.deleteCredential({ tokenId: cred.tokenId || cred.id, serialNumber: String(cred.serialNumber || 1) });
                              setCredentials(prev => prev.filter(c => c !== cred));
                            }}
                          >
                            <Trash2 size={16} strokeWidth={1} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCredentials.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                                <Search size={32} strokeWidth={1} />
                            </div>
                            <p>No hay credenciales emitidas aún.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile List View */}
            <div className="md:hidden px-4 py-4 space-y-4">
              {orderedCredentials.map((cred, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold text-white text-lg">{cred.studentName || 'Anon'}</div>
                      <div className="text-sm text-slate-400">{cred.title}</div>
                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border border-white/10 text-slate-300 bg-white/5">
                        {String(cred.type || 'titulo').toLowerCase().includes('cert') ? 'Certificado' : 'Título'}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border ${
                      String(cred.status || '').toLowerCase() === 'revoked'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : String(cred.status || '') === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {String(cred.status || '').toLowerCase() === 'revoked' ? 'Revocada' : (cred.status === 'verified' ? 'Verificado' : (cred.status === 'pending' ? 'Pendiente' : 'Confirmado'))}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col gap-1 font-mono">
                    <span>{cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : 'Hoy'}</span>
                    {(cred.tokenId || cred.id) && (
                      <span className="truncate">
                        ID: {cred.tokenId || cred.id}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        const url = toGateway(cred.ipfsURI);
                        if (!url) {
                          toast.error('Este registro aún no tiene documento en IPFS');
                          return;
                        }
                        setDocUrl(url);
                        setDocOpen(true);
                      }}
                    >
                      <Eye size={14} strokeWidth={1} /> Ver
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                      onClick={() => { setSelectedCred(cred); setRevokeReason(''); setRevokeOpen(true); }}
                    >
                      <XCircle size={14} strokeWidth={1} /> Revocar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {revokeOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/60" onClick={() => setRevokeOpen(false)} />
                <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md p-8 shadow-2xl">
                  <h3 className="text-2xl font-black text-white mb-6">Revocar Credencial</h3>
                  <div className="p-4 rounded-xl bg-white/5 mb-6 border border-white/5">
                      <p className="text-sm text-slate-400 mb-1">Identificador del Título</p>
                      <span className="font-mono text-emerald-400 text-lg">{selectedCred?.id || selectedCred?.tokenId}</span>
                  </div>
                  <div className="form-control mb-6">
                    <label className="label text-slate-300 text-sm mb-2 block">Razón de la revocación</label>
                    <textarea 
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-red-500/50 transition-colors resize-none" 
                      placeholder="Ej: Error administrativo, plagio detectado..."
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors" onClick={() => setRevokeOpen(false)}>Cancelar</button>
                    <button 
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all"
                      onClick={async () => {
                        toast.loading("Revocando en Blockchain...");
                        try {
                           await apiService.revokeCredential({ 
                               tokenId: selectedCred.id || selectedCred.tokenId, 
                               reason: revokeReason 
                           });
                           toast.dismiss();
                           toast.success("Credencial revocada correctamente");
                           setRevokeOpen(false);
                           setCredentials(prev => prev.map(c => c.id === selectedCred.id ? { ...c, status: 'revoked' } : c));
                        } catch (e) {
                           toast.dismiss();
                           toast.error("Error al revocar");
                        }
                      }}
                    >
                      Confirmar Revocación
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      }
      case 'emitir':
      default:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             {renderLimitBanner()}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   {/* Main Action Card */}
                   <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                      <div className="relative z-10">
                          <h2 className="text-4xl font-black tracking-tighter text-white mb-2">
                             Emisión <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Certificada</span>
                          </h2>
                          <p className="text-slate-400 mb-8 max-w-xl leading-relaxed">
                             Genera credenciales académicas inmutables registradas en Hedera Hashgraph. 
                             Garantiza la autenticidad perpetua para tus estudiantes.
                          </p>

                          <div className="bg-black/20 rounded-xl border border-white/5 p-1">
                             <div className="flex p-1 gap-1">
                                <button 
                                   onClick={() => setIssuanceMode('individual')}
                                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${issuanceMode === 'individual' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                   <User size={16} strokeWidth={1} /> Individual
                                </button>
                                <button 
                                   onClick={() => setIssuanceMode('mass')}
                                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${issuanceMode === 'mass' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                   <Layers size={16} strokeWidth={1} /> Lote CSV
                                </button>
                             </div>
                          </div>
                          
                          <div className="mt-8">
                             {issuanceMode === 'individual' ? (
                                <CertificationStepper 
                                  currentStep={currentStep} 
                                  setCurrentStep={setCurrentStep}
                                  isEditingDesign={isEditingDesign}
                                  setIsEditingDesign={setIsEditingDesign}
                                  issueFormData={issueFormData}
                                  setIssueFormData={setIssueFormData}
                                  savedDesign={savedDesign}
                                  setSavedDesign={setSavedDesign}
                                  institutionName={institutionName}
                                  institutionLogo={institutionLogo}
                                  plan={currentPlan}
                                  emissionsUsed={emissionsUsed}
                                  setEmissionsUsed={setEmissionsUsed}
                                />
                             ) : (
                                <BatchIssuance 
                                  demo={demo} 
                                  plan={currentPlan} 
                                  emissionsUsed={emissionsUsed}
                                  onEmissionComplete={(count) => setEmissionsUsed(prev => prev + count)}
                                  institutionName={institutionName}
                                />
                             )}
                          </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   {/* Institution Profile Card */}
                   <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Shield size={18} className="text-emerald-500" strokeWidth={1} /> Perfil Institucional
                         </h3>
                         <button onClick={() => setIsEditingName(!isEditingName)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                            <Settings size={16} strokeWidth={1} />
                         </button>
                      </div>
                      
                      <div className="flex flex-col items-center mb-6">
                         <div className="relative group cursor-pointer w-24 h-24 mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-emerald-500/50 transition-colors">
                               {institutionLogo ? (
                                  <img src={institutionLogo} alt="Logo" className="w-full h-full object-cover" />
                               ) : (
                                  <span className="text-3xl font-bold text-slate-700">LOGO</span>
                               )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                               <Upload size={20} className="text-white" strokeWidth={1} />
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
                         </div>
                         
                         {isEditingName ? (
                            <div className="flex gap-2 w-full">
                               <input 
                                  value={institutionName} 
                                  onChange={(e) => setInstitutionName(e.target.value)}
                                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-white text-center w-full focus:outline-none focus:border-emerald-500/50"
                                  autoFocus
                               />
                               <button onClick={handleNameSave} className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/30">
                                  <CheckCircle size={16} strokeWidth={1} />
                               </button>
                            </div>
                         ) : (
                            <h4 className="text-xl font-bold text-white text-center">{institutionName}</h4>
                         )}
                         <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-widest">ID: {user?.id || 'INST-8842'}</p>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-sm text-slate-400">Plan Actual</span>
                            <span className="text-sm font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/20">{currentPlan.name}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-sm text-slate-400">Emisiones</span>
                            <div className="text-right">
                               <span className="text-sm font-bold text-white block">{emissionsUsed} / {currentPlan.limit === Infinity ? '∞' : currentPlan.limit}</span>
                               <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" 
                                    style={{ width: `${Math.min((emissionsUsed / (currentPlan.limit || 100)) * 100, 100)}%` }}
                                  ></div>
                               </div>
                            </div>
                         </div>
                         <button 
                            onClick={() => setShowPlanModal(true)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 hover:border-purple-500/60 text-purple-200 text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                         >
                            Mejorar Plan
                         </button>
                      </div>
                   </div>

                   {/* Network Status */}
                   <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Estado de Red</h3>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="p-2 rounded-lg bg-slate-800/50">
                                  <Hexagon size={18} className="text-slate-400" strokeWidth={1} />
                               </div>
                               <div>
                                  <div className="text-white text-sm font-medium">Hedera Hashgraph</div>
                                  <div className="text-emerald-500 text-[10px] font-mono">OPERATIONAL</div>
                               </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                         </div>
                         {selectedNetworks.includes('xrp') && (
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-slate-800/50">
                                     <Globe size={18} className="text-slate-400" strokeWidth={1} />
                                  </div>
                                  <div>
                                     <div className="text-white text-sm font-medium">XRP Ledger</div>
                                     <div className="text-emerald-500 text-[10px] font-mono">OPERATIONAL</div>
                                  </div>
                               </div>
                               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                            </div>
                         )}
                         <div className="pt-4 border-t border-white/5">
                            <LiveBlockVisualizer />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        );
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-500 font-mono text-sm tracking-widest animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-emerald-500/30 flex overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(13, 13, 13, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        },
      }} />

      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300"
      >
        <div className="h-20 flex items-center justify-center border-b border-white/5 relative">
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 absolute'}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-bold text-xl">A</div>
                <span className="font-bold text-xl tracking-tight text-white">Academic<span className="text-emerald-400">Chain</span></span>
            </div>
            {!sidebarOpen && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-bold text-xl">A</div>
            )}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors shadow-lg z-50"
            >
                <ChevronRight size={14} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </button>
        </div>

        <nav className="flex-1 py-8 px-2 space-y-2 overflow-y-auto custom-scrollbar">
            {[
                { id: 'emitir', icon: Zap, label: 'Emitir Credencial' },
                { id: 'masiva', icon: Layers, label: 'Emisión Masiva' },
                { id: 'narrativas', icon: PenTool, label: 'Diseñador' },
                { id: 'credenciales', icon: History, label: 'Historial' },
                { id: 'analiticas', icon: BarChart3, label: 'Analíticas' },
                { id: 'recargar', icon: CreditCard, label: 'Recargar Créditos' },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        activeTab === item.id 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <div className={`p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-transparent text-slate-500 group-hover:text-white'}`}>
                        <item.icon size={20} strokeWidth={1} />
                    </div>
                    {sidebarOpen && (
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                    )}
                    {activeTab === item.id && sidebarOpen && (
                        <motion.div layoutId="activeTabIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-white/5">
            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${!sidebarOpen && 'justify-center'}`}>
                <LogOut size={20} strokeWidth={1} />
                {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 relative ${sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}
      >
         {/* Top Bar */}
         <header className="sticky top-0 z-40 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 h-20 px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">
               {activeTab === 'emitir' && 'Panel de Emisión'}
               {activeTab === 'masiva' && 'Emisión por Lotes'}
               {activeTab === 'narrativas' && 'Diseñador de Plantillas'}
               {activeTab === 'credenciales' && 'Registro Histórico'}
               {activeTab === 'analiticas' && 'Inteligencia de Datos'}
               {activeTab === 'recargar' && 'Gestión de Créditos'}
            </h1>

            <div className="flex items-center gap-6">
               <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-black/20 border border-white/5">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-xs font-mono text-emerald-500">MAINNET ACTIVE</span>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="text-xs text-slate-400 font-mono">LATENCY: 24ms</div>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                     <div className="text-sm font-bold text-white">{user?.name || 'Administrador'}</div>
                     <div className="text-xs text-slate-500">{user?.institutionName || 'Institución'}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white font-bold">
                     {user?.name?.charAt(0) || 'A'}
                  </div>
               </div>
            </div>
         </header>

         {/* Content Padding */}
         <div className="p-8 pb-20">
            <AnimatePresence mode="wait">
               {renderContent()}
            </AnimatePresence>
         </div>

         {/* Document Viewer Modal */}
         <DocumentViewer
            isOpen={docOpen}
            onClose={() => setDocOpen(false)}
            url={docUrl}
            metadata={docMetadata}
         />

         {/* Plan Upgrade Modal */}
         <InstitutionSubscriptionModal 
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            currentPlan={currentPlan}
            onSubscribe={handleSubscribe}
         />
      </main>
    </div>
  );
}

export default EnhancedInstitutionDashboard;
