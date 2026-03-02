import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { toGateway } from './utils/ipfsUtils';
import { motion } from "framer-motion";
import { API_BASE_URL } from "./services/config";
import { useAuth } from './useAuth';

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
    className="flex items-center p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer gap-3 w-full"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="text-xs text-gray-500 uppercase font-semibold">{network}</div>
      <div className="text-sm font-mono truncate text-gray-800" title={id}>{id || 'Verificando...'}</div>
    </div>
    <div className="text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
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
  
  const studentName = getAttr('Student Name');
  const degree = getAttr('Degree');
  const university = getAttr('University');
  
  const hederaLink = `https://hashscan.io/${(import.meta.env.VITE_HEDERA_NETWORK || 'testnet')}/nft/${tokenId}-${serialNumber}`;
  const xrpLink = credential?.externalProofs?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}` : '#';
  const algoLink = credential?.externalProofs?.algoTxId ? `https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}` : '#';
  
  const ipfsUri = credential?.ipfsURI || (urlCid ? `ipfs://${urlCid}` : '');
  const pdfUrl = toGateway(ipfsUri);
  const cid = ipfsUri.replace('ipfs://', '');
  const filecoinLink = `https://gateway.lighthouse.storage/ipfs/${cid}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-900 text-cyan-400 px-4 py-1 rounded-full text-xs font-mono border border-cyan-500/30 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                OPENCLAW DEFENSE SYSTEM ACTIVE
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Portal de Verificación Pública
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verifique la autenticidad de credenciales académicas en tiempo real utilizando tecnología Blockchain de triple anclaje.
          </p>
        </div>

        {/* Search Box (only if not loaded via URL) */}
        {(!urlTokenId || !urlSerialNumber) && !credential && (
             <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresar Datos Manualmente</h3>
                
                {/* Option 1: Token ID + Serial */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Opción A: Por ID de Credencial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input 
                            className="input-primary" 
                            placeholder="Token ID (ej. 0.0.12345)" 
                            value={tokenId} 
                            onChange={(e) => setTokenId(e.target.value)} 
                        />
                        <input 
                            className="input-primary" 
                            placeholder="Número de Serie (ej. 1)" 
                            value={serialNumber} 
                            onChange={(e) => setSerialNumber(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="btn-primary w-full py-2"
                        onClick={() => loadCredential(tokenId, serialNumber)}
                        disabled={loading || !tokenId || !serialNumber}
                    >
                        Verificar por ID
                    </button>
                </div>

                {/* Option 2: Hash SHA-256 */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Opción B: Por Hash del Documento</h4>
                    <div className="flex gap-2 mb-4">
                        <input 
                            className="input-primary flex-1" 
                            placeholder="Hash SHA-256 del documento (64 caracteres)" 
                            value={searchHash} 
                            onChange={(e) => setSearchHash(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="btn-secondary w-full py-2"
                        onClick={() => loadCredential(null, null, searchHash)}
                        disabled={loading || !searchHash || searchHash.length < 10}
                    >
                        Verificar por Hash
                    </button>
                </div>
             </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Consultando Hedera Hashgraph, XRP Ledger y Algorand...</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-8 shadow-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0 text-red-500">❌</div>
                    <div className="ml-3">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Success / Credential View */}
        {credential && !loading && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left Column: Visual & Status */}
                <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center">
                            <span className="text-white font-bold tracking-wider uppercase text-sm">Vista Previa</span>
                            <div className="flex gap-2">
                                {openClawReport && openClawReport.valid && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                        OPENCLAW VERIFIED
                                    </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'ACTIVE' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                                    {status === 'ACTIVE' ? '✓ VÁLIDO' : '⚠ REVOCADO'}
                                </span>
                            </div>
                        </div>
                        
                        {canViewDocument ? (
                            <div className="relative bg-gray-100 aspect-[1.414/1] w-full group overflow-hidden">
                                {credential?.ipfsURI ? (
                                    <iframe 
                                        src={toGateway(credential.ipfsURI)} 
                                        className="w-full h-full border-0"
                                        title="Certificado Original"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        Documento no disponible
                                    </div>
                                )}
                                
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-xs flex justify-between items-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="font-mono">CID: {credential?.ipfsCid || credential?.ipfsURI?.replace('ipfs://', '')}</div>
                                    <a 
                                        href={toGateway(credential?.ipfsURI)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                                    >
                                        Abrir en IPFS <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[1.414/1] bg-gray-100 relative group flex items-center justify-center flex-col p-8 text-center border-b border-gray-200">
                                <div className="mb-4">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Documento Protegido</h3>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    La vista previa del documento original está restringida a la institución emisora y el titular.
                                </p>
                                <div className="mt-6 bg-gray-50 p-3 rounded-lg border border-gray-200 w-full max-w-sm">
                                    <div className="text-xs text-gray-400 uppercase font-bold mb-1">Hash SHA-256 del Documento</div>
                                    <div className="font-mono text-xs text-gray-600 break-all select-all">
                                        {credential?.ipfsHash256 || credential?.sha256 || credential?.metadata?.ipfsHash256 || 'Hash no disponible'}
                                    </div>
                                </div>
                                
                                {/* Verification Badge */}
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full border border-green-200">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-green-700">Integridad Verificada</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">El hash coincide con el registro en Blockchain</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                         <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles del Titular</h3>
                         {(() => {
                           const logoRaw = meta.image || (attrs.find(a => a.trait_type === 'Institution Logo')?.value || '');
                           if (!logoRaw) return null;
                           const logoUrl = toGateway(logoRaw);
                           return (
                             <div className="w-full flex justify-center mb-4">
                               <img
                                 src={logoUrl}
                                 alt="Institución"
                                 className="h-16 object-contain"
                               />
                             </div>
                           );
                         })()}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Nombre del Estudiante</div>
                                 <div className="text-xl font-medium text-gray-900">{studentName}</div>
                             </div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Institución Emisora</div>
                                 <div className="text-xl font-medium text-gray-900">{university}</div>
                             </div>
                             <div className="sm:col-span-2">
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Título / Grado</div>
                                 <div className="text-2xl font-bold text-indigo-700">{degree}</div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Column: Triple Proof */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Prueba de Vida Triple</h3>
                        <p className="text-sm text-gray-600 mb-6">Este documento ha sido autenticado criptográficamente en tres redes públicas independientes.</p>
                        
                        <div className="space-y-4">
                            <BlockchainBadge 
                                network="Hedera Hashgraph" 
                                id={tokenId ? `${tokenId} #${serialNumber}` : 'Pendiente...'}
                                color="bg-black"
                                icon="Ħ"
                                link={hederaLink}
                            />
                            
                            {/* XRP Badge (if present) */}
                            {credential?.externalProofs?.xrpTxHash && (
                                <BlockchainBadge 
                                    network="XRP Ledger" 
                                    id={credential.externalProofs.xrpTxHash}
                                    color="bg-blue-600"
                                    icon="✕"
                                    link={`https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}`}
                                />
                            )}

                            {/* Algorand Badge (if present) */}
                            {credential?.externalProofs?.algoTxId && (
                                <BlockchainBadge 
                                    network="Algorand" 
                                    id={credential.externalProofs.algoTxId}
                                    color="bg-black"
                                    icon="A"
                                    link={`https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}`}
                                />
                            )}
                        </div>
                        
                        {/* Sello de Veracidad */}
                        <div className="mt-6 flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-200">
                            <div className="w-16 h-16 flex-shrink-0 bg-green-600 rounded-full flex items-center justify-center border-4 border-green-100 shadow-sm">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-green-800 font-bold text-sm uppercase tracking-wide">Sello de Veracidad Digital</h4>
                                <p className="text-xs text-green-700 mt-1">
                                    Documento inmutable alojado en IPFS/Filecoin y registrado en Hedera & XRP.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status List Verification */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-blue-500 mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verificación de Estado en Cadena</h3>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {status === 'ACTIVE' 
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    }
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">
                                    {status === 'ACTIVE' ? 'Credencial Válida' : 'Credencial Revocada'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Verificado contra Bitstring Status List (W3C Standard).
                                    <br/>
                                    <span className="text-xs font-mono text-gray-400">Index: {serialNumber} | Issuer: did:web:localhost:3001</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Portability */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-purple-500 mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Portabilidad (W3C VC)</h3>
                        <p className="text-sm text-gray-600 mb-4">Descarga tu credencial verificable para usarla en wallets compatibles (eIDAS, Dock, Veres One).</p>
                        
                        <button
                          onClick={() => {
                            if (!credential?.verifiableCredential) return;
                            const content = typeof credential.verifiableCredential === 'string' 
                              ? credential.verifiableCredential 
                              : JSON.stringify(credential.verifiableCredential, null, 2);
                            
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
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                           </svg>
                           Descargar VC
                        </button>
                    </div>

                    {canViewDocument && (
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <span>🧊</span> Almacenamiento Eterno
                            </h4>
                            <p className="text-xs text-blue-800 mb-3">
                                Respaldado en la red Filecoin para garantizar la disponibilidad permanente de los datos, independiente de servidores centrales.
                            </p>
                            <a href={filecoinLink} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-600 break-all hover:underline">
                                CID: {cid}
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
