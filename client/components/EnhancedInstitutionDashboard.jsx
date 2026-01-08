import React, { useEffect, useState, useRef } from 'react';
import ConnectionService from './services/connectionService';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import DocumentViewer from './ui/DocumentViewer';
import demoService from './services/demoService';
import useHedera from './useHedera';
import { useAuth } from './useAuth';
import PlanUpgrade from './PlanUpgrade';
import { issuanceService } from './services/issuanceService';
import { toGateway, getGateways } from './utils/ipfsUtils';
import { motion } from 'framer-motion';
import { theme } from './themeConfig';
import jsPDF from 'jspdf';

function EnhancedInstitutionDashboard({ demo = false }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);
  const [aclAssociated, setAclAssociated] = useState(true);
  const [aclChecking, setAclChecking] = useState(false);
  const [aclAssociating, setAclAssociating] = useState(false);
  const [aclBalance, setAclBalance] = useState('0');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [uploadedCid, setUploadedCid] = useState('');
  const [uploadedUri, setUploadedUri] = useState('');
  const [uploadedHash, setUploadedHash] = useState('');
  const [mintTx, setMintTx] = useState(null);
  const [shimmerOn, setShimmerOn] = useState(false);
  const [logoSrc, setLogoSrc] = useState(toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGateways = useRef(getGateways('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGwIndex = useRef(0);
  const fileInputRef = useRef(null);
  const hedera = useHedera();
  const { user } = useAuth();
  const plan = (user?.plan || 'basic').toLowerCase();
  const [selectedNetworks, setSelectedNetworks] = useState(plan === 'enterprise' ? ['hedera','xrp','algorand'] : (plan === 'standard' ? ['hedera','xrp'] : ['hedera']));
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [customLogoCid, setCustomLogoCid] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const handleLogoError = () => {
    logoGwIndex.current = Math.min(logoGwIndex.current + 1, logoGateways.current.length - 1);
    const next = logoGateways.current[logoGwIndex.current] || logoSrc;
    setLogoSrc(next);
  };
  const handleWhiteLabelLogo = async (file) => {
    if (!file) return;
    try {
      const uri = await issuanceService.uploadToIPFS(file);
      const cid = String(uri || '').replace('ipfs://','');
      setCustomLogoCid(cid);
      const gw = toGateway(`ipfs://${cid}`);
      setCustomLogoUrl(gw);
      logoGateways.current = getGateways(`ipfs://${cid}`);
      logoGwIndex.current = 0;
      setLogoSrc(gw);
    } catch {}
  };

  useEffect(() => {
    try {
      const storedColor = localStorage.getItem('acl:brand:primaryColor');
      const storedLogo = localStorage.getItem('acl:brand:logoUrl');
      const storedName = localStorage.getItem('acl:brand:institutionName');
      if (storedColor) setPrimaryColor(storedColor);
      if (storedLogo) {
        setCustomLogoUrl(storedLogo);
        setLogoSrc(storedLogo);
      }
      if (storedName) setInstitutionName(storedName);
    } catch {}
  }, []);

  const hexToRgb = (hex) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const darkenHex = (hex, amount = 30) => {
    const { r, g, b } = hexToRgb(hex);
    const dr = clamp(r - amount);
    const dg = clamp(g - amount);
    const db = clamp(b - amount);
    return `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`;
  };
  const softenHex = (hex, amount = 180) => {
    const { r, g, b } = hexToRgb(hex);
    const sr = clamp(r + amount);
    const sg = clamp(g + amount);
    const sb = clamp(b + amount);
    return `#${sr.toString(16).padStart(2,'0')}${sg.toString(16).padStart(2,'0')}${sb.toString(16).padStart(2,'0')}`;
  };
  useEffect(() => {
    try {
      if (primaryColor) {
        localStorage.setItem('acl:brand:primaryColor', primaryColor);
        const hover = darkenHex(primaryColor, 32);
        const soft = softenHex(primaryColor, 160);
        document.documentElement.style.setProperty('--brand-primary', primaryColor);
        document.documentElement.style.setProperty('--brand-primary-hover', hover);
        document.documentElement.style.setProperty('--brand-primary-soft', soft);
      }
    } catch {}
  }, [primaryColor]);
  useEffect(() => {
    try {
      if (customLogoUrl) {
        localStorage.setItem('acl:brand:logoUrl', customLogoUrl);
        document.documentElement.style.setProperty('--brand-logo-url', customLogoUrl);
      }
    } catch {}
  }, [customLogoUrl]);
  useEffect(() => {
    try {
      if (institutionName) {
        localStorage.setItem('acl:brand:institutionName', institutionName);
        document.documentElement.style.setProperty('--brand-institution-name', institutionName);
      }
    } catch {}
  }, [institutionName]);
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

  const handleDrop = async (e) => {
    e.preventDefault();
    setStepError('');
    const files = e.dataTransfer?.files || [];
    const file = files[0] || null;
    if (!file) return;
    try {
      setStep(1);
      const uri = await issuanceService.uploadToIPFS(file);
      setUploadedCid(uri.replace('ipfs://',''));
      setUploadedUri(uri);
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(buf));
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
      setUploadedHash(hex);
      setStep(2);
      if (!aclAssociated) {
        setStepError('La wallet no está asociada al token ACL.');
        return;
      }
      setStep(3);
      if (!tokenIdInput) {
        setStepError('Ingresa un Token ID válido para emitir.');
        return;
      }
      const base = import.meta.env.VITE_API_URL || '';
      const prepRes = await fetch(`${base}/api/universities/prepare-issuance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenId: tokenIdInput.trim(), uniqueHash: hex, ipfsURI: uri })
      });
      const prep = await prepRes.json();
      if (!prep.success) {
        setStepError(prep.message || 'Error al preparar emisión');
        return;
      }
      const txId = prep?.data?.transactionId;
      const execRes = await fetch(`${base}/api/universities/execute-issuance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionId: txId })
      });
      const exec = await execRes.json();
      if (!exec.success) {
        setStepError(exec.message || 'Error al mintear');
        return;
      }
      setMintTx(exec?.data?.mint || null);
    } catch (e) {
      setStepError(e.message || 'Error en la carga');
    }
  };

  const handleSelectFile = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    const ev = { preventDefault: () => {}, dataTransfer: { files: dt.files } };
    await handleDrop(ev);
  };

  useEffect(() => {
    const checkAcl = async () => {
      try {
        setAclChecking(true);
        if (demo) {
          setAclAssociated(true);
          setAclBalance('0');
          return;
        }
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${base}/api/universities/acl/association-status`, { headers: { 'Accept': 'application/json' }, credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        const ok = !!data?.data?.associated;
        setAclAssociated(ok);
        try {
          const balRes = await fetch(`${base}/api/universities/acl/balance`, { headers: { 'Accept': 'application/json' }, credentials: 'include' });
          const bal = await balRes.json().catch(() => ({}));
          const v = String(bal?.data?.balance || '0');
          setAclBalance(v);
        } catch {}
      } catch {
        setAclAssociated(false);
      } finally {
        setAclChecking(false);
      }
    };
    checkAcl();
  }, [demo]);

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

  const handleAclAssociate = async () => {
    try {
      setAclAssociating(true);
      const base = import.meta.env.VITE_API_URL || '';
      const prepRes = await fetch(`${base}/api/universities/acl/associate/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const prep = await prepRes.json();
      const bytes = prep?.data?.transactionBytesBase64 || '';
      if (!bytes) throw new Error('No se pudo preparar la transacción');
      const signed = await hedera.signTransactionBytes(bytes);
      if (!signed) throw new Error('Firma rechazada o inválida');
      const subRes = await fetch(`${base}/api/universities/acl/associate/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signedTransactionBytes: signed })
      });
      const sub = await subRes.json();
      const ok = (sub?.data?.status || '').toUpperCase() === 'SUCCESS';
      if (ok) {
        setAclAssociated(true);
      }
    } catch (e) {
    } finally {
      setAclAssociating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto" style={{ paddingLeft: theme.spacing.sectionPx, paddingRight: theme.spacing.sectionPx, paddingBottom: theme.spacing.sectionPb }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0" style={{ paddingLeft: theme.spacing.sectionPx, paddingRight: theme.spacing.sectionPx, paddingBottom: theme.spacing.sectionPb }}>
      <div className="flex">
        <div className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 md:w-64 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform bg-gray-900 text-white border-r border-gray-800`}>
          <div className="p-4 font-bold text-lg">Herramientas</div>
          <nav className="space-y-1 px-2">
            <a href="#emitir" className="block px-3 py-2 rounded hover:bg-gray-800">Emitir</a>
            <a href="#masiva" className="block px-3 py-2 rounded hover:bg-gray-800">Emisión Masiva</a>
            <a href="#credenciales" className="block px-3 py-2 rounded hover:bg-gray-800">Credenciales</a>
          </nav>
          <div className="m-3 mt-4 rounded-lg border border-gray-800 bg-gray-800 p-3">
            <div className="text-sm font-semibold">Estado de Plan</div>
            <div className="text-xs text-gray-300 mt-1">{plan === 'basic' ? 'Esencial ($49/mes)' : (plan === 'standard' ? 'Profesional ($99/mes)' : 'Global Enterprise (Custom)')}</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Hedera</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-700 text-white text-xs">✅ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${plan==='basic' ? 'text-gray-400' : ''}`}>XRP</span>
                {plan==='basic' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">🔒 Sube a Profesional</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-700 text-white text-xs">✅ Activo</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`${plan!=='enterprise' ? 'text-gray-400' : ''}`}>Algorand</span>
                {plan!=='enterprise' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">🔒 Sube a Enterprise</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-700 text-white text-xs">✅ Activo</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 md:ml-6">
          <div className="md:hidden p-3">
            <button className="btn-secondary" onClick={() => setSidebarOpen(v => !v)}>{sidebarOpen ? 'Cerrar' : 'Menú'}</button>
          </div>
          <div className="px-4 md:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Institución</h1>
              <p className="text-gray-600">Gestiona tus credenciales académicas y emisiones</p>
              {renderConnectionStatus()}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700">
                  <span className="mr-2">ACL Balance</span>
                  <span className="font-mono">{aclBalance}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full ${aclAssociated ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-800'}`}>
                  {aclAssociated ? 'Wallet Asociada' : 'Wallet sin asociación'}
                </div>
              </div>
              {plan === 'enterprise' && (
                <div className="relative mt-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-yellow-500/60 rounded-xl p-4 shadow-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-yellow-300 font-semibold text-sm md:text-base">
                    ✨ Estatus de Seguridad Global: Triple Blindaje de Integridad Activado (Nivel 3)
                  </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <motion.span
                        className="inline-flex items-center px-2 py-1 rounded-full bg-green-900 text-green-200 text-xs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                        transition={{ delay: 0, duration: 0.6 }}
                      >
                        Hedera
                      </motion.span>
                      <motion.span
                        className="inline-flex items-center px-2 py-1 rounded-full bg-green-900 text-green-200 text-xs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      >
                        XRP
                      </motion.span>
                      <motion.span
                        className="inline-flex items-center px-2 py-1 rounded-full bg-green-900 text-green-200 text-xs"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        onAnimationComplete={() => setShimmerOn(true)}
                      >
                        Algorand
                      </motion.span>
                    </div>
                  </div>
                  {shimmerOn && (
                    <motion.img
                      src={logoSrc}
                      onError={handleLogoError}
                      alt="Logo Institucional"
                      className="absolute top-3 right-3 h-8 w-8 sm:h-10 sm:w-10 lg:h-14 lg:w-14 rounded-full lg:shadow-xl lg:shadow-black/20"
                      style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                      initial={{ scale: 1, opacity: 0.95 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ delay: 2, duration: 0.5, repeat: 2, repeatDelay: 2.5 }}
                    />
                  )}
                  {shimmerOn && (
                    <motion.div
                      className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                      initial={{ x: '-20%', opacity: 0 }}
                      animate={{ x: '120%', opacity: [0, 1, 0] }}
                      transition={{ duration: 2, ease: 'linear', repeat: 2, repeatDelay: 1 }}
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,230,120,0.85) 50%, rgba(255,255,255,0) 100%)',
                      }}
                    />
                  )}
                  <div className="mt-3 bg-gray-900/60 border border-yellow-500/30 rounded-lg p-3">
                    <div className="text-xs text-yellow-200 mb-2">Personalización White Label (Enterprise)</div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 w-12 rounded" />
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/png,image/svg+xml" onChange={(e) => handleWhiteLabelLogo(e.target.files?.[0] || null)} />
                        {customLogoUrl && <img src={customLogoUrl} alt="Logo" className="h-8 w-8 rounded" />}
                      </div>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="Nombre de la institución"
                        className="input-primary w-56"
                      />
                      <button className="btn-secondary btn-sm" onClick={async () => {
                        try {
                          const doc = new jsPDF();
                          if (customLogoUrl) {
                            try {
                              const r = await fetch(customLogoUrl);
                              const b = await r.blob();
                              const reader = new FileReader();
                              await new Promise((res, rej) => { reader.onload = () => res(); reader.onerror = rej; reader.readAsDataURL(b); });
                              doc.addImage(reader.result, 'PNG', 10, 10, 20, 20);
                            } catch {}
                          }
                          doc.setFontSize(16);
                          doc.text('ACADEMIC CHAIN LEDGER: PROPUESTA ENTERPRISE', 10, customLogoUrl ? 40 : 20);
                          doc.setFontSize(12);
                          doc.text('Solución: Infraestructura de Triple Blindaje Blockchain (Hedera + XRP + Algorand)', 10, (customLogoUrl ? 55 : 35));
                          doc.text('Costo Mensual: $599.99 USD (Incluye 5,000 emisiones)', 10, (customLogoUrl ? 65 : 45));
                          doc.text('Costo Unitario: $0.12 USD', 10, (customLogoUrl ? 75 : 55));
                          doc.text('Garantía: SLA de 99.9% y soporte VIP 24/7', 10, (customLogoUrl ? 85 : 65));
                          doc.text('Implementación: API Key inmediata o On‑Premise', 10, (customLogoUrl ? 95 : 75));
                          doc.text('Beneficio: Auditoría internacional y resiliencia por triple consenso distribuido', 10, (customLogoUrl ? 105 : 85));
                          doc.save('Propuesta-ACL-Enterprise.pdf');
                        } catch {}
                      }}>Descargar Propuesta PDF</button>
                    </div>
                  </div>
                </div>
              )}
          <div className="mt-4 bg-gray-900/80 border border-gray-800 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-white font-semibold text-sm md:text-base">Ahorra 20% pagando con ACL</div>
                <div className="text-gray-300 text-xs md:text-sm">Obtén más créditos enviando ACL al tesoro institucional.</div>
              </div>
              <a href="/institution/credits" className="btn-primary">Recargar Créditos</a>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Redes para emisión</div>
            <div className="flex items-center gap-2 flex-wrap">
              {['hedera','xrp','algorand'].map((n) => {
                const allowed = (plan === 'enterprise') || (plan === 'standard' ? ['hedera','xrp'].includes(n) : n === 'hedera');
                const selected = selectedNetworks.includes(n);
                const label = n === 'hedera' ? 'Hedera' : (n === 'xrp' ? 'XRP' : 'Algorand');
                return (
                  <button
                    key={n}
                    className={`inline-flex items-center px-3 py-1 rounded-full border ${selected ? 'text-white' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                    style={selected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    onClick={() => {
                      if (!allowed) { setUpgradeOpen(true); return; }
                      setSelectedNetworks((prev) => {
                        if (prev.includes(n)) return prev.filter(x => x !== n);
                        return prev.concat(n);
                      });
                    }}
                  >
                    <span className="mr-2">{label}</span>
                    {!allowed && <span>🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
              {!aclAssociated && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 font-semibold">Tu wallet de Hedera no está asociada al token ACL.</p>
                      <p className="text-yellow-700 text-sm">Asocia el token para habilitar pagos y envíos de tokens.</p>
                    </div>
                    <button
                      className="btn-primary"
                      disabled={aclChecking || aclAssociating || connectionStatus !== 'connected'}
                      onClick={handleAclAssociate}
                    >
                      {aclAssociating ? 'Asociando...' : 'Asociar Token ACL'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            <div id="emitir" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${(!aclAssociated && connectionStatus === 'connected' && !demo) ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Emitir Credencial Individual</h2>
                <IssueTitleForm demo={connectionStatus === 'demo'} networks={selectedNetworks} />
              </div>
              <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${(!aclAssociated && connectionStatus === 'connected' && !demo) ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Drag & Drop (IPFS → ACL → Hedera)</h2>
                <div className="mb-3">
                  <input className="input-primary w-full" placeholder="Token ID (ej. 0.0.7560139)" value={tokenIdInput} onChange={(e) => setTokenIdInput(e.target.value)} />
                </div>
                <div
                  className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="text-2xl mb-2">Arrastra tu PDF aquí</div>
                  <div className="text-gray-600 mb-3">o</div>
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Seleccionar archivo</button>
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSelectFile} />
                  {uploadedCid ? (
                    <div className="mt-4 text-sm">
                      <div className="font-mono break-all">CID: {uploadedCid}</div>
                      <a className="text-blue-600 underline" href={toGateway(uploadedUri)} target="_blank" rel="noreferrer">Ver PDF</a>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`rounded-lg border p-4 ${step >= 1 ? 'border-green-500' : 'border-gray-200'}`}>
                      <div className="font-semibold">Paso 1</div>
                      <div className="text-sm">Subiendo a IPFS</div>
                    </div>
                    <div className={`rounded-lg border p-4 ${step >= 2 ? 'border-purple-500' : 'border-gray-200'}`}>
                      <div className="font-semibold">Paso 2</div>
                      <div className="text-sm">Verificando Asociación ACL</div>
                    </div>
                    <div className={`rounded-lg border p-4 ${step >= 3 ? 'border-blue-500' : 'border-gray-200'}`}>
                      <div className="font-semibold">Paso 3</div>
                      <div className="text-sm">Minteando en Hedera</div>
                    </div>
                  </div>
                  {stepError && <div className="mt-3 text-red-600">{stepError}</div>}
                  {mintTx && (
                    <div className="mt-3 text-sm">
                      <div>NFT Serial: {mintTx.serialNumber}</div>
                      <a className="text-blue-600 underline" href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/nft/${tokenIdInput}-${mintTx.serialNumber}`} target="_blank" rel="noreferrer">Ver en HashScan</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div id="masiva" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${(!aclAssociated && connectionStatus === 'connected' && !demo) ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Emisión Masiva</h2>
                <BatchIssuance demo={connectionStatus === 'demo'} />
              </div>
            </div>
            <div id="credenciales" className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Credenciales Emitidas</h2>
              {credentials.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay credenciales emitidas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {credentials.slice(0, 10).map((cred) => (
                        <tr key={cred.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cred.studentName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cred.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cred.tokenId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(cred.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <PlanUpgrade open={upgradeOpen} onClose={() => setUpgradeOpen(false)} currentPlan={plan} />
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
        </div>
      </div>
    </div>
  );
}

export default EnhancedInstitutionDashboard;
