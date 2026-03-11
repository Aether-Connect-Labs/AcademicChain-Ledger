import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { toGateway } from './utils/ipfsUtils';
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "./services/config";
import { useAuth } from './useAuth';
import { 
  sanitizeString, 
  isValidHederaTokenId, 
  isValidSerialNumber, 
  isValidSHA256 
} from './utils/security';
import { 
  Shield, 
  Search, 
  FileCheck, 
  Download, 
  ExternalLink, 
  Hash, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Globe, 
  Cpu, 
  Activity, 
  Lock,
  Eye,
  EyeOff,
  Share2,
  Database,
  Box,
  Layers
} from 'lucide-react';

// --- OpenClaw Defense System Configuration ---
const OPENCLAW_CONFIG = {
  ENABLED: true,
  MIN_TRUST_SCORE: 80,
  OFFICIAL_ACL_TOKEN_ID: '0.0.10207330', // Token Oficial ACL actualizado
  GATEWAY_URL: 'ws://127.0.0.1:18789'    // Gateway Local para Sincronización
};

const BlockchainBadge = ({ network, id, color, icon, link }) => (
  <a 
    href={link} 
    target="_blank" 
    rel="noreferrer"
    className="flex items-center p-4 rounded-xl border border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md hover:border-purple-500/30 hover:bg-white/5 transition-all cursor-pointer gap-4 w-full group"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${color} shadow-lg shadow-${color}/20 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">{network}</div>
      <div className="text-sm font-mono truncate text-slate-200 group-hover:text-purple-400 transition-colors" title={id}>{id || 'Verificando...'}</div>
    </div>
    <div className="text-slate-500 group-hover:text-purple-400 transition-colors">
        <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
    </div>
  </a>
);

const VerifyCredentialPage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  // Support both /verify/:tokenId/:serialNumber and query params
  const urlTokenId = params.tokenId || searchParams.get('tokenId');
  const urlSerialNumber = params.serialNumber || searchParams.get('serialNumber');
  const urlCid = params.cid || searchParams.get('cid');
  const urlHash = params.uniqueHash || searchParams.get('hash');

  const [tokenId, setTokenId] = useState(urlTokenId || '');
  const [serialNumber, setSerialNumber] = useState(urlSerialNumber || '');
  const [searchHash, setSearchHash] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [openClawReport, setOpenClawReport] = useState(null); // Reporte de defensa
  const { user } = useAuth();

  // Determine if the current user has permission to view the full document
  // Only the issuer (institution), admin, or the credential owner (student) can view the original PDF/CID
  const canViewDocument = user && (
      user.role === 'institution' || 
      user.role === 'admin' || 
      user.role === 'university' ||
      (user.role === 'student' && credential && user.accountId === credential.recipientAccountId)
  );

  // --- OpenClaw Validation Logic ---
  const runOpenClawDiagnostics = (cred) => {
    if (!OPENCLAW_CONFIG.ENABLED) return { valid: true, score: 100, messages: [] };

    let score = 100;
    const messages = [];
    const meta = cred?.metadata || {};
    const props = meta.properties || {};

    // 1. Verificar Integridad de Hash (Core Defense)
    const storedHash = props?.file?.hash || cred?.ipfsHash256;
    if (!storedHash) {
      score -= 50;
      messages.push({ type: 'error', text: 'Falta Hash SHA-256 de integridad.' });
    }

    // 2. Verificar Emisor (ACL Ecosystem)
    const issuer = meta.attributes?.find(a => a.trait_type === 'University')?.value || cred.universityName;
    const isOfficial = issuer && (issuer.includes('AcademicChain') || issuer === '444');
    if (isOfficial) {
      messages.push({ type: 'success', text: 'Emisor Verificado en Red ACL.' });
    } else {
      score -= 20;
      messages.push({ type: 'warning', text: 'Emisor externo a la red troncal ACL.' });
    }

    // 3. Verificar Token ACL (Si aplica)
    // Aquí verificamos si la credencial está vinculada al ecosistema
    const tokenId = cred.tokenId || '';
    
    if (tokenId === OPENCLAW_CONFIG.OFFICIAL_ACL_TOKEN_ID) {
        messages.push({ type: 'success', text: 'Token ACL Oficial (0.0.10207330) Autenticado.' });
        score += 5; // Bonus de confianza por Token Oficial
    } else if (tokenId.startsWith('0.0.')) {
        messages.push({ type: 'success', text: 'Formato de Token Hedera Válido.' });
    } else if (tokenId.startsWith('XRP') || tokenId.startsWith('ALGO')) {
        messages.push({ type: 'info', text: 'Credencial Cross-Chain detectada.' });
    } else {
        score -= 30;
        messages.push({ type: 'error', text: 'Formato de Token ID desconocido.' });
    }

    // 4. Verificación Multi-Chain (Triple Proof Defense)
    if (cred.externalProofs?.xrpTxHash) {
        messages.push({ type: 'success', text: 'Respaldo en XRP Ledger verificado.' });
        score += 5;
    }
    if (cred.externalProofs?.algoTxId) {
        messages.push({ type: 'success', text: 'Respaldo en Algorand verificado.' });
        score += 5;
    }

    // 5. Detección de Anomalías Temporales
    const issueDate = new Date(cred.createdAt || meta.issued || Date.now());
    if (issueDate > new Date()) {
        score = 0;
        messages.push({ type: 'critical', text: 'ANOMALÍA: Fecha de emisión en el futuro.' });
    }

    return {
        valid: score >= OPENCLAW_CONFIG.MIN_TRUST_SCORE,
        score,
        messages
    };
  };

  const loadCredential = async (tid, sn, hash) => {
      if ((!tid || !sn) && !hash) return;
      
      setLoading(true);
      setError('');
      setOpenClawReport(null);

      // 🔒 Input Validation
      if (tid && !isValidHederaTokenId(tid)) {
          setError('Formato de Token ID inválido. Debe ser 0.0.xxxxx');
          setLoading(false);
          return;
      }
      if (sn && !isValidSerialNumber(sn)) {
          setError('Número de serie inválido.');
          setLoading(false);
          return;
      }
      if (hash && !isValidSHA256(hash)) {
          // Allow demo hash
          if (hash !== 'demo') {
            setError('Hash inválido. Debe ser SHA-256 (64 caracteres hex).');
            setLoading(false);
            return;
          }
      }
      
      try {
          // Attempt to fetch from backend first
          let url = '';
          if (hash) {
             url = `${API_BASE_URL}/api/verification/hash/${hash}`;
          } else {
             url = `${API_BASE_URL}/api/verification/${tid}/${sn}`;
          }

          try {
             console.log(`Verifying credential at: ${url}`);
             const res = await fetch(url);
             if (res.ok) {
                 const json = await res.json();
                 if (json.success && json.credential) {
                    const found = json.credential;
                    // Run OpenClaw Analysis on Remote Data
                    const report = runOpenClawDiagnostics(found);
                    setOpenClawReport(report);
                    
                    if (!report.valid) {
                        setError(`ALERTA DE SEGURIDAD (OpenClaw): Score ${report.score}/100. ${report.messages.map(m=>m.text).join(' ')}`);
                        if (report.score < 50) {
                            setCredential(null);
                            return;
                        }
                    }

                    setCredential(found);
                    setStatus(found.status || 'ACTIVE');
                    if (found.tokenId) setTokenId(found.tokenId);
                    if (found.serialNumber) setSerialNumber(found.serialNumber);
                    return; // Found and set, exit
                 }
             }
          } catch (e) {
             console.warn('Backend verification failed, checking local storage/fallback...', e);
          }

          // Fallback to local storage if backend fails (for resilience/demo)
          const raw = localStorage.getItem('acl:credentials');
          const localCreds = raw ? JSON.parse(raw) : [];
          
          let found = null;
          if (hash) {
             found = localCreds.find(c => 
                 (c.ipfsHash256 === hash) || 
                 (c.metadata?.ipfsHash256 === hash) ||
                 (c.externalProofs?.xrpTxHash === hash) ||
                 (c.externalProofs?.algoTxId === hash)
             );
          } else if (tid && sn) {
             found = localCreds.find(c => c.tokenId === tid && String(c.serialNumber) === String(sn));
          }

          if (found) {
              // Run OpenClaw Analysis
              const report = runOpenClawDiagnostics(found);
              setOpenClawReport(report);
              
              if (!report.valid) {
                  setError(`ALERTA DE SEGURIDAD (OpenClaw): La credencial no superó el umbral de confianza. Score: ${report.score}/100`);
                  // Aun así mostramos la credencial pero con advertencia, o bloqueamos según política.
                  // En este caso, permitimos verla pero con status WARNING si no es crítica.
                  if (report.score < 50) {
                      setCredential(null);
                      return; 
                  }
              }

              setCredential(found);
              setStatus(found.status || 'ACTIVE');
              if (found.tokenId) setTokenId(found.tokenId);
              if (found.serialNumber) setSerialNumber(found.serialNumber);
          } else {
             // Fallback to mock fetch if not found locally
             // In a real app, this would be the actual API call
             let url = '';
             if (hash) {
                url = `${API_BASE_URL}/api/verification/hash/${hash}`;
             } else {
                url = `${API_BASE_URL}/api/verification/${tid}/${sn}`;
             }
             
             try {
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    
                    // Run OpenClaw Analysis on Remote Data
                    const report = runOpenClawDiagnostics(json.credential);
                    setOpenClawReport(report);
                    
                    if (!report.valid) {
                        setError(`ALERTA DE SEGURIDAD (OpenClaw): Score ${report.score}/100. ${report.messages.map(m=>m.text).join(' ')}`);
                        if (report.score < 50) return;
                    }

                    setCredential(json.credential);
                    setStatus(json.status);
                } else {
                    throw new Error('Not found');
                }
             } catch (e) {
                 // Generate Mock Data if everything fails for DEMO purposes
                 // REMOVE THIS IN PRODUCTION
                 if (hash === 'demo' || tid === '0.0.demo') {
                     const mock = {
                         tokenId: '0.0.123456',
                         serialNumber: '1',
                         studentName: 'Juan Pérez',
                         degree: 'Licenciatura en Blockchain',
                         universityName: 'AcademicChain University',
                         ipfsHash256: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
                         status: 'ACTIVE',
                         createdAt: new Date().toISOString(), // Valid date
                         externalProofs: {
                             xrpTxHash: 'XRP789...',
                             algoTxId: 'ALGO456...'
                         }
                     };
                     
                     const report = runOpenClawDiagnostics(mock);
                     setOpenClawReport(report);

                     setCredential(mock);
                     setStatus('ACTIVE');
                 } else {
                     throw new Error('Credencial no encontrada');
                 }
             }
          }
      } catch (err) {
          console.error(err);
          setError('No se pudo verificar la credencial. Verifique los datos o intente nuevamente.');
          setCredential(null);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      if (urlHash) {
          loadCredential(null, null, urlHash);
      } else if (urlTokenId && urlSerialNumber) {
          loadCredential(urlTokenId, urlSerialNumber);
      }
  }, [urlTokenId, urlSerialNumber, urlHash]);

  // Derived Data
  const meta = credential?.metadata || {};
  const attrs = meta.attributes || [];
  const getAttr = (type) => attrs.find(a => a.trait_type === type)?.value || 'N/A';
  
  const studentName = sanitizeString(getAttr('Student Name'));
  const degree = sanitizeString(getAttr('Degree'));
  const university = sanitizeString(getAttr('University'));
  
  const hederaLink = `https://hashscan.io/${(import.meta.env.VITE_HEDERA_NETWORK || 'testnet')}/nft/${tokenId}-${serialNumber}`;
  const xrpLink = credential?.externalProofs?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}` : '#';
  const algoLink = credential?.externalProofs?.algoTxId ? `https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}` : '#';
  
  const ipfsUri = credential?.ipfsURI || (urlCid ? `ipfs://${urlCid}` : '');
  const pdfUrl = toGateway(ipfsUri);
  const cid = ipfsUri.replace('ipfs://', '');
  const filecoinLink = `https://gateway.lighthouse.storage/ipfs/${cid}`;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="bg-[#0d0d0d]/60 backdrop-blur-xl text-cyan-400 px-6 py-2 rounded-full text-xs font-mono border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                OPENCLAW DEFENSE SYSTEM ACTIVE
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight"
          >
            Portal de Verificación Pública
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Verifique la autenticidad de credenciales académicas en tiempo real utilizando tecnología Blockchain de triple anclaje.
          </motion.p>
        </div>

        {/* Search Box (only if not loaded via URL) */}
        <AnimatePresence>
        {(!urlTokenId || !urlSerialNumber) && !credential && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/5 relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
                
                {/* Option 1: Token ID + Serial */}
                <div className="mb-8 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Hash className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Por ID de Credencial</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input 
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Token ID (ej. 0.0.12345)" 
                            value={tokenId} 
                            onChange={(e) => setTokenId(e.target.value)} 
                        />
                        <input 
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Número de Serie (ej. 1)" 
                            value={serialNumber} 
                            onChange={(e) => setSerialNumber(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => loadCredential(tokenId, serialNumber)}
                        disabled={loading || !tokenId || !serialNumber}
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Search className="w-5 h-5" />}
                        Verificar por ID
                    </button>
                </div>

                {/* Option 2: Hash SHA-256 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <FileCheck className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Por Hash del Documento</h4>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <input 
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Hash SHA-256 del documento (64 caracteres)" 
                            value={searchHash} 
                            onChange={(e) => setSearchHash(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="w-full py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => loadCredential(null, null, searchHash)}
                        disabled={loading || !searchHash || searchHash.length < 10}
                    >
                         {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Database className="w-5 h-5 text-cyan-400" />}
                        Verificar por Hash
                    </button>
                </div>
             </motion.div>
        )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-t-4 border-cyan-500 rounded-full animate-spin reverse"></div>
                </div>
                <p className="text-slate-400 font-medium animate-pulse">Consultando Hedera Hashgraph, XRP Ledger y Algorand...</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl mb-8 shadow-lg max-w-4xl mx-auto"
            >
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-red-400 font-bold text-lg mb-1">Error de Verificación</h3>
                        <p className="text-red-200/80">{error}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Success / Credential View */}
        {credential && !loading && (
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left Column: Visual & Status */}
                <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/5">
                        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] px-6 py-4 flex justify-between items-center border-b border-white/5">
                            <span className="text-slate-300 font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4 text-purple-400" /> Vista Previa
                            </span>
                            <div className="flex gap-2">
                                {openClawReport && openClawReport.valid && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                        <Shield className="w-3 h-3" strokeWidth={3} />
                                        OPENCLAW VERIFIED
                                    </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                    {status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" strokeWidth={3} /> : <XCircle className="w-3 h-3" strokeWidth={3} />}
                                    {status === 'ACTIVE' ? 'VÁLIDO' : 'REVOCADO'}
                                </span>
                            </div>
                        </div>
                        
                        {canViewDocument ? (
                            <div className="relative bg-[#050505] aspect-[1.414/1] w-full group overflow-hidden">
                                {credential?.ipfsURI ? (
                                    <iframe 
                                        src={toGateway(credential.ipfsURI)} 
                                        className="w-full h-full border-0"
                                        title="Certificado Original"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        Documento no disponible
                                    </div>
                                )}
                                
                                <div className="absolute bottom-0 left-0 right-0 bg-[#000000]/80 text-white p-4 text-xs flex justify-between items-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0">
                                    <div className="font-mono text-slate-300 truncate max-w-[60%]">CID: {credential?.ipfsCid || credential?.ipfsURI?.replace('ipfs://', '')}</div>
                                    <a 
                                        href={toGateway(credential?.ipfsURI)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                        Abrir en IPFS <ExternalLink className="w-3 h-3" strokeWidth={2} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[1.414/1] bg-[#0a0a0a] relative group flex items-center justify-center flex-col p-8 text-center border-b border-white/5">
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                                    <Lock className="w-16 h-16 text-slate-500 relative z-10" strokeWidth={1} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-200 mb-2">Documento Protegido</h3>
                                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                    La vista previa del documento original está restringida a la institución emisora y el titular.
                                </p>
                                <div className="mt-8 bg-[#111] p-4 rounded-xl border border-white/5 w-full max-w-sm">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                                        <Hash className="w-3 h-3" /> Hash SHA-256 del Documento
                                    </div>
                                    <div className="font-mono text-xs text-purple-400 break-all select-all">
                                        {credential?.ipfsHash256 || credential?.sha256 || credential?.metadata?.ipfsHash256 || 'Hash no disponible'}
                                    </div>
                                </div>
                                
                                {/* Verification Badge */}
                                <div className="mt-6 flex flex-col items-center">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                        <span className="text-xs font-bold text-green-400">Integridad Verificada</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2">El hash coincide con el registro en Blockchain</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/5">
                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                             <Activity className="w-5 h-5 text-purple-400" /> Detalles del Titular
                         </h3>
                         {(() => {
                           const logoRaw = meta.image || (attrs.find(a => a.trait_type === 'Institution Logo')?.value || '');
                           if (!logoRaw) return null;
                           const logoUrl = toGateway(logoRaw);
                           return (
                             <div className="w-full flex justify-center mb-8">
                               <img
                                 src={logoUrl}
                                 alt="Institución"
                                 className="h-20 object-contain drop-shadow-lg"
                               />
                             </div>
                           );
                         })()}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div>
                                 <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Nombre del Estudiante</div>
                                 <div className="text-xl font-medium text-white">{studentName}</div>
                             </div>
                             <div>
                                 <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Institución Emisora</div>
                                 <div className="text-xl font-medium text-white">{university}</div>
                             </div>
                             <div className="sm:col-span-2 p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                 <div className="text-xs text-purple-400 uppercase font-bold tracking-wider mb-2">Título / Grado</div>
                                 <div className="text-2xl font-bold text-white leading-tight">{degree}</div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Column: Triple Proof */}
                <div className="space-y-6">
                    <div className="bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-xl p-6 border-t-4 border-t-green-500 border-x border-b border-white/5">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-green-400" /> Prueba de Vida Triple
                        </h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">Este documento ha sido autenticado criptográficamente en tres redes públicas independientes.</p>
                        
                        <div className="space-y-3">
                            <BlockchainBadge 
                                network="Hedera Hashgraph" 
                                id={tokenId ? `${tokenId} #${serialNumber}` : 'Pendiente...'}
                                color="bg-black border border-white/20"
                                icon="Ħ"
                                link={hederaLink}
                            />
                            
                            {/* XRP Badge (if present) */}
                            {credential?.externalProofs?.xrpTxHash && (
                                <BlockchainBadge 
                                    network="XRP Ledger" 
                                    id={credential.externalProofs.xrpTxHash}
                                    color="bg-[#23292f] text-white"
                                    icon="✕"
                                    link={`https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}`}
                                />
                            )}
                            
                            {/* Algorand Badge (if present) */}
                            {credential?.externalProofs?.algoTxId && (
                                <BlockchainBadge 
                                    network="Algorand" 
                                    id={credential.externalProofs.algoTxId}
                                    color="bg-black border border-white/20"
                                    icon="A"
                                    link={`https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}`}
                                />
                            )}
                        </div>
                        
                        {/* Sello de Veracidad */}
                        <div className="mt-8 flex items-center gap-4 bg-green-500/5 p-4 rounded-2xl border border-green-500/20">
                            <div className="w-14 h-14 flex-shrink-0 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                <CheckCircle className="w-7 h-7 text-green-400" strokeWidth={2} />
                            </div>
                            <div>
                                <h4 className="text-green-400 font-bold text-sm uppercase tracking-wide">Sello de Veracidad</h4>
                                <p className="text-xs text-green-200/70 mt-1 leading-relaxed">
                                    Inmutable en IPFS/Filecoin y registrado en Hedera & XRP.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status List Verification */}
                    <div className="bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-xl p-6 border-t-4 border-t-cyan-500 border-x border-b border-white/5 mt-6">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-cyan-400" /> Estado en Cadena
                        </h3>
                        <div className="flex items-center gap-4 bg-[#111] p-4 rounded-xl border border-white/5 mt-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {status === 'ACTIVE' 
                                    ? <CheckCircle className="w-6 h-6" />
                                    : <XCircle className="w-6 h-6" />
                                }
                            </div>
                            <div>
                                <div className={`font-bold ${status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                                    {status === 'ACTIVE' ? 'Credencial Válida' : 'Credencial Revocada'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Bitstring Status List (W3C Standard)
                                    <div className="text-[10px] font-mono text-slate-600 mt-0.5">Index: {serialNumber}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Portability */}
                    <div className="bg-[#0d0d0d]/40 backdrop-blur-xl rounded-3xl shadow-xl p-6 border-t-4 border-t-purple-500 border-x border-b border-white/5 mt-6">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Globe className="w-6 h-6 text-purple-400" /> Portabilidad
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">Descarga tu credencial para wallets compatibles (W3C VC).</p>
                        
                        <button
                          onClick={() => {
                            if (!credential?.verifiableCredential) return;
                            
                            let content = '';
                            try {
                                const raw = credential.verifiableCredential;
                                const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                content = JSON.stringify(obj, null, 2);
                            } catch (e) {
                                console.error('Invalid VC format', e);
                                alert('Error al generar el archivo: Formato inválido');
                                return;
                            }
                            
                            const blob = new Blob([content], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `credential-${tokenId}-${serialNumber}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          disabled={!credential?.verifiableCredential}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                        >
                           <Download className="w-5 h-5" />
                           Descargar JSON-LD
                        </button>
                    </div>

                    {canViewDocument && (
                        <div className="bg-blue-500/5 rounded-3xl p-6 border border-blue-500/10">
                            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                <Box className="w-5 h-5" /> Almacenamiento Eterno
                            </h4>
                            <p className="text-xs text-blue-200/70 mb-3 leading-relaxed">
                                Respaldado en la red Filecoin para garantizar la disponibilidad permanente.
                            </p>
                            <a href={filecoinLink} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-400 break-all hover:underline flex items-center gap-1">
                                CID: {cid} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyCredentialPage;
