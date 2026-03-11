import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios'; // Added for metrics
import { toast, Toaster } from 'react-hot-toast'; // Added notifications
import CertificationStepper from './CertificationStepper'; // Added Stepper
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import DocumentViewer from './ui/DocumentViewer';
import { institutionService } from './services/institutionService';
import { issuanceService } from './services/issuanceService';
import { verificationService } from './services/verificationService';
import { demoService } from './services/demoService';
import { toGateway } from './utils/ipfsUtils';
import { useAuth } from './useAuth.jsx';
import developerService from './services/developerService';
import TrustBadge from './TrustBadge'; // Added TrustBadge
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import apiService from './services/apiService';
import useAnalytics from './useAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

function InstitutionDashboard({ demo = false }) {
  const { token, user, setSession } = useAuth() || { token: '', user: null, setSession: () => {} };
  const [dpaSigning, setDpaSigning] = useState(false);
  const [dpaError, setDpaError] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [errorCreds, setErrorCreds] = useState('');
  const [filterTokenId, setFilterTokenId] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [deletedCount, setDeletedCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({ revoked: 0, deleted: 0, verified: 0, pending: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [sort, setSort] = useState('desc');
  const [sortBy, setSortBy] = useState('createdAt');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, pages: 1, hasMore: false, from: 0, to: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetPage, setTargetPage] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenMemo, setTokenMemo] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verifySerial, setVerifySerial] = useState('');
  const [docOpen, setDocOpen] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [qrTokenId, setQrTokenId] = useState('');
  const [qrSerial, setQrSerial] = useState('');
  const [qrIssuerId, setQrIssuerId] = useState('');
  const [qrPngSize, setQrPngSize] = useState(512);
  const [qrCopyMsg, setQrCopyMsg] = useState('');
  const [qrMeta, setQrMeta] = useState(null);
  const { trackCredentialOperation } = useAnalytics();
  const [qrMetaLoading, setQrMetaLoading] = useState(false);
  const [qrIpfsURI, setQrIpfsURI] = useState('');
  const [qrTxId, setQrTxId] = useState('');
  const [institutionalLogoUrl, setInstitutionalLogoUrl] = useState('');
  const [demoTokenId, setDemoTokenId] = useState('');
  const [demoUniqueHash, setDemoUniqueHash] = useState('');
  const [demoIpfsURI, setDemoIpfsURI] = useState('ipfs://QmDemoCid');
  const [demoRecipientAccountId, setDemoRecipientAccountId] = useState('');
  const [demoIssuanceMsg, setDemoIssuanceMsg] = useState('');
  const [demoIssuanceErr, setDemoIssuanceErr] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoIssued, setDemoIssued] = useState([]);
  const [demoPinMsg, setDemoPinMsg] = useState('');
  const [demoPinErr, setDemoPinErr] = useState('');
  const [demoImageCid, setDemoImageCid] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiGenerating, setApiGenerating] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState('');
  const [revokingKey, setRevokingKey] = useState('');
  const [rotatingKey, setRotatingKey] = useState('');
  const [rateLimit, setRateLimit] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [onPrem] = useState(false);
  const [usage, setUsage] = useState({ hedera: 0, xrp: 0, algorand: 0 });
  const [labLoading, setLabLoading] = useState(false);
  const [labMessage, setLabMessage] = useState('');
  const [labError, setLabError] = useState('');
  const [securityHover, setSecurityHover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Dashboard States
  const [dashboardMetrics, setDashboardMetrics] = useState({
      totalEmissions: 0,
      successfulAnchors: 0,
      employabilityRate: '0%',
      totalStudents: 0
  });
  const [currentCertificationStep, setCurrentCertificationStep] = useState(0); 
  const [latestTransactionId, setLatestTransactionId] = useState(null);

  // Fetch Real-time Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
        try {
            // Adjust endpoint if needed (using localhost for dev or relative path)
            const res = await axios.get('/api/metrics/dashboard');
            if (res.data.success) {
                setDashboardMetrics(res.data.metrics);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard metrics", error);
        }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Listen for Hire Events (Success Notification)
  useEffect(() => {
    const handleHired = (event) => {
        const { studentName, employerName, courseName } = event.detail || {};
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));

        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-green-500`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <span className="text-3xl">🎉</span>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">¡Impacto Confirmado!</p>
                            <p className="mt-1 text-sm text-slate-400">
                                <span className="text-green-400 font-bold">{studentName}</span> ha sido contratado por <span className="text-blue-400 font-bold">{employerName}</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Certificado: {courseName}</p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 8000 });
    };

    window.addEventListener('acl:hired', handleHired);

    const handleStorage = (e) => {
        if (e.key === 'acl:event:hired') {
            const data = JSON.parse(e.newValue);
            handleHired({ detail: data });
        }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('acl:hired', handleHired);
        window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Simulate Stepper on Certification Start (Callback for IssueTitleForm if we modify it)
  const handleCertificationStart = () => {
      setCurrentCertificationStep(1);
      setTimeout(() => setCurrentCertificationStep(2), 3000); // Simulate XRPL/Algo time
      setTimeout(() => {
          setCurrentCertificationStep(3);
          setLatestTransactionId("0.0.4576394"); // Hardcoded for demo visualization
      }, 6000); // Simulate Hedera time
  };

  const simulateEmission = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 6500)),
      {
        loading: 'Iniciando proceso de emisión multichain...',
        success: '¡Certificado emitido con éxito en Hedera!',
        error: 'Error en la emisión',
      }
    );
    handleCertificationStart();
  };
  



  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem('acl:brand:logoUrl');
      if (storedLogo) setInstitutionalLogoUrl(storedLogo);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (institutionalLogoUrl) {
        localStorage.setItem('acl:brand:logoUrl', institutionalLogoUrl);
        document.documentElement.style.setProperty('--brand-logo-url', institutionalLogoUrl);
      }
    } catch {}
  }, [institutionalLogoUrl]);

  const handleRevokeClick = (cred) => {
    setSelectedCredential(cred);
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const confirmRevocation = async () => {
    if (!selectedCredential || !revokeReason) return;
    setRevoking(true);
    try {
      await institutionService.revokeCredential(token, selectedCredential._id, revokeReason);
      setRevokeModalOpen(false);
      loadCredentials({ page }); 
      try {
        await refreshGlobalStats();
      } catch {}
      try {
        trackCredentialOperation({
          operation: 'revoke',
          role: 'institution',
          tokenId: selectedCredential.tokenId,
          serialNumber: String(selectedCredential.serialNumber || ''),
          reason: revokeReason
        });
      } catch {}
    } catch (e) {
      alert('Error revoking credential: ' + e.message);
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteIssuedCredential = async (cred) => {
    const ok = window.confirm('¿Borrar esta emisión del portal institucional? Esto no afecta el estado on-chain.');
    if (!ok) return;
    try {
      await apiService.deleteCredential({ tokenId: cred.tokenId, serialNumber: cred.serialNumber });
      setCredentials(prev => prev.filter(x => !(String(x.tokenId) === String(cred.tokenId) && String(x.serialNumber) === String(cred.serialNumber))));
      setDeletedCount(v => v + 1);
      try { await refreshGlobalStats(); } catch {}
      try {
        trackCredentialOperation({
          operation: 'delete',
          role: 'institution',
          tokenId: cred.tokenId,
          serialNumber: String(cred.serialNumber || '')
        });
      } catch {}
    } catch (e) {
      alert('No se pudo borrar la credencial.');
    }
  };

  const handleRequestVerification = async (cred) => {
    try {
      await apiService.requestCredentialVerification({ tokenId: cred.tokenId, serialNumber: cred.serialNumber, role: 'institution' });
      try {
        trackCredentialOperation({
          operation: 'verify',
          role: 'institution',
          tokenId: cred.tokenId,
          serialNumber: String(cred.serialNumber || ''),
          reason: 'verification_requested'
        });
      } catch {}
      setCredentials(prev => prev.map(x => (String(x.tokenId) === String(cred.tokenId) && String(x.serialNumber) === String(cred.serialNumber)) ? { ...x, status: 'pending' } : x));
      try { await refreshGlobalStats(); } catch {}
      alert('Solicitud de verificación enviada. Estado: Pendiente');
    } catch (e) {
      alert('No se pudo enviar la solicitud de verificación.');
    }
  };

  const loadCredentials = async (params = {}) => {
    setLoadingCreds(true);
    setErrorCreds('');
    try {
      // Merge current state with new params
      const currentParams = {
        page: params.page || page,
        limit: params.limit || limit,
        sort: params.sort || sort,
        sortBy: params.sortBy || sortBy,
        tokenId: params.tokenId !== undefined ? params.tokenId : (filterTokenId || undefined),
        accountId: params.accountId !== undefined ? params.accountId : (filterAccountId || undefined)
      };

      // Update state
      if (params.page) setPage(params.page);
      if (params.limit) setLimit(params.limit);
      if (params.sort) setSort(params.sort);
      if (params.sortBy) setSortBy(params.sortBy);

      // Update URL
      const urlParams = {
        page: String(currentParams.page),
        limit: String(currentParams.limit),
        sort: currentParams.sort,
        sortBy: currentParams.sortBy
      };
      if (currentParams.tokenId) urlParams.tokenId = currentParams.tokenId;
      if (currentParams.accountId) urlParams.accountId = currentParams.accountId;
      setSearchParams(urlParams);

      const data = await issuanceService.getCredentials(currentParams);
      const list = data?.data?.credentials || [];
      const metaData = data?.data?.meta || { page: currentParams.page, limit: currentParams.limit, total: list.length, pages: 1, hasMore: false };
      
      setCredentials(list);
      setMeta(metaData);
      setPage(metaData.page);
      setLimit(metaData.limit);
    } catch (e) {
      setErrorCreds(e.message);
    } finally {
      setLoadingCreds(false);
    }
  };

  const refreshGlobalStats = useCallback(async () => {
    try {
      let issuerId = null;
      try {
        issuerId = String(user?.id || user?.universityId || '');
      } catch {}
      if (!issuerId && credentials && credentials.length > 0) {
        issuerId = String(credentials[0]?.universityId || '');
      }
      const statsResp = await apiService.getCredentialStats({ scope: 'institution', issuerId, role: 'institution' });
      if (statsResp && statsResp.success) {
        setGlobalStats({
          revoked: Number(statsResp.revoked || 0),
          deleted: Number(statsResp.deleted || 0),
          verified: Number(statsResp.verified || 0),
          pending: Number(statsResp.pending || 0)
        });
      } else {
        const revoked = credentials.filter(x => String(x.status || '').toLowerCase() === 'revoked').length;
        const pending = credentials.filter(x => String(x.status || '').toLowerCase() === 'pending').length;
        const verified = credentials.filter(x => String(x.status || '').toLowerCase() === 'verified').length;
        setGlobalStats({ revoked, deleted: deletedCount, verified, pending });
      }
    } catch {
      const revoked = credentials.filter(x => String(x.status || '').toLowerCase() === 'revoked').length;
      const pending = credentials.filter(x => String(x.status || '').toLowerCase() === 'pending').length;
      const verified = credentials.filter(x => String(x.status || '').toLowerCase() === 'verified').length;
      setGlobalStats({ revoked, deleted: deletedCount, verified, pending });
    }
  }, [user, credentials, deletedCount]);

  useEffect(() => {
    (async () => {
      try { await refreshGlobalStats(); } catch {}
    })();
  }, [refreshGlobalStats]);
  useEffect(() => {
    if (demo) {
      const sample = [
        { id: 'demo-1', tokenId: '0.0.123456', serialNumber: '1', title: 'Título Profesional en Ingeniería', issuer: 'Demo University', ipfsURI: 'ipfs://QmDemoCid1', createdAt: new Date().toISOString(), recipientAccountId: '0.0.987654' },
        { id: 'demo-2', tokenId: '0.0.123456', serialNumber: '2', title: 'Certificado de Curso Avanzado', issuer: 'Demo University', ipfsURI: 'ipfs://QmDemoCid2', createdAt: new Date().toISOString(), recipientAccountId: '0.0.987655' },
        { id: 'demo-3', tokenId: '0.0.987654', serialNumber: '1', title: 'Diploma de Posgrado en Blockchain', issuer: 'Demo Institute', ipfsURI: 'ipfs://QmDemoCid3', createdAt: new Date().toISOString(), recipientAccountId: '0.0.987656' }
      ];
      setCredentials(sample);
      setMeta({ total: sample.length, page: 1, limit: 10, pages: 1, hasMore: false, from: 1, to: sample.length });
      setStats({
        totalCredentials: 3,
        totalTokens: 2,
        totalRecipients: 3,
        lastIssuance: new Date().toISOString()
      });
      return;
    }
    (async () => {
      try {
        const s = await apiService.getCredentialStats();
        if (s && s.success) setGlobalStats({ revoked: Number(s.revoked || 0), deleted: Number(s.deleted || 0), verified: Number(s.verified || 0), pending: Number(s.pending || 0) });
      } catch {}
    })();
    const initialTokenId = searchParams.get('tokenId') || '';
    const initialAccountId = searchParams.get('accountId') || '';
    const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1;
    const initialLimit = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const initialSort = searchParams.get('sort') || 'desc';
    const initialSortBy = searchParams.get('sortBy') || 'createdAt';
    
    setFilterTokenId(initialTokenId);
    setFilterAccountId(initialAccountId);
    setPage(initialPage);
    setLimit(initialLimit);
    setSort(initialSort);
    setSortBy(initialSortBy);

    loadCredentials({
      page: initialPage,
      limit: initialLimit,
      sort: initialSort,
      sortBy: initialSortBy,
      tokenId: initialTokenId || undefined,
      accountId: initialAccountId || undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, searchParams]); // Keep deps but loadCredentials handles avoiding loops if implemented carefully or just use initial load logic


  const handleCreateToken = async () => {
    setCreatingToken(true);
    setTokenError('');
    setTokenMessage('');
    try {
      if (demo) {
        const data = await demoService.createToken({ tokenName, tokenSymbol: tokenSymbol || undefined });
        const tid = data?.data?.tokenId || data?.data?.token?.tokenId || '';
        setTokenMessage(`Token demo creado: ${tid}`);
        setDemoTokenId(tid);
        setTokenName(''); setTokenSymbol(''); setTokenMemo('');
        return;
      }
      const data = await issuanceService.createToken({ tokenName, tokenSymbol, tokenMemo: tokenMemo || undefined });
      setTokenMessage(`Token creado: ${data?.data?.tokenId || data?.data?.token?.tokenId || 'ok'}`);
      setTokenName('');
      setTokenSymbol('');
      setTokenMemo('');
    } catch (e) {
      setTokenError(e.message);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDemoIssuance = async () => {
    if (!demo) return;
    setDemoLoading(true); setDemoIssuanceErr(''); setDemoIssuanceMsg('');
    try {
      const payload = {
        tokenId: demoTokenId || filterTokenId || tokenName || '0.0.0',
        uniqueHash: demoUniqueHash || Math.random().toString(36).slice(2),
        ipfsURI: demoIpfsURI,
        recipientAccountId: demoRecipientAccountId || undefined,
        degree: tokenMemo || undefined,
        studentName: undefined,
        image: demoImageCid ? `ipfs://${String(demoImageCid).replace('ipfs://','')}` : undefined,
      };
      const data = await demoService.issueCredential(payload);
      const url = data?.data?.hashscanUrl || '';
      const nftId = data?.data?.nftId || '';
      setDemoIssuanceMsg(`Emitido en testnet: ${nftId}`);
      setDemoIssued(prev => [{ nftId, tokenId: payload.tokenId, serialNumber: nftId.split('-').pop(), ipfsURI: payload.ipfsURI, hashscanUrl: url, createdAt: new Date().toISOString() }, ...prev].slice(0, 10));
      if (url) window.open(url, '_blank');
    } catch (e) {
      setDemoIssuanceErr(e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const maskKey = (k) => {
    if (!k) return '';
    const head = k.slice(0, 10);
    const tail = k.slice(-4);
    return `${head}${'•'.repeat(Math.max(0, k.length - head.length - tail.length))}${tail}`;
  };

  const generateLocalKey = () => {
    const bytes = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `acl_live_${hex}`;
  };

  const handleGenerateApiKey = async () => {
    setApiGenerating(true);
    setApiMessage('');
    try {
      let key = '';
      if (token) {
        try {
          const res = await developerService.issueApiKey(token);
          key = res?.data?.apiKey || '';
        } catch (e) {
          key = '';
        }
      }
      if (!key) key = generateLocalKey();
      setApiKey(key);
      setApiKeyVisible(false);
      setApiMessage('API Key generada correctamente.');
      const now = new Date().toISOString();
      setApiKeys(prev => [{ apiKey: key, status: 'active', createdAt: now, lastUsedAt: null }, ...prev]);
    } catch (e) {
      setApiMessage(e.message || 'Error generando la API Key');
    } finally {
      setApiGenerating(false);
    }
  };

  const loadApiKeys = useCallback(async () => {
    if (!token) return;
    setApiKeysLoading(true);
    setApiKeysError('');
    try {
      const res = await developerService.listApiKeys(token);
      const list = res?.data?.apiKeys || res?.data || [];
      setApiKeys(Array.isArray(list) ? list : []);
    } catch (e) {
      setApiKeysError(e.message || 'No fue posible obtener las claves');
    } finally {
      setApiKeysLoading(false);
    }
  }, [token]);

  const handleRevokeApiKey = async (key) => {
    setRevokingKey(key);
    try {
      if (token) {
        try {
          await developerService.revokeApiKey(token, key);
        } catch {}
      }
      setApiKeys(prev => prev.map(k => k.apiKey === key ? { ...k, status: 'revoked' } : k));
      if (apiKey === key) setApiKey('');
    } finally {
      setRevokingKey('');
    }
  };

  const handleRotateApiKey = async (key) => {
    setRotatingKey(key);
    try {
      let newKey = '';
      if (token) {
        try {
          const res = await developerService.rotateApiKey(token, key);
          newKey = res?.data?.apiKey || '';
        } catch {}
      }
      if (!newKey) newKey = generateLocalKey();
      setApiKeys(prev => prev.map(k => k.apiKey === key ? { ...k, status: 'rotated' } : k));
      const now = new Date().toISOString();
      setApiKeys(prev => [{ apiKey: newKey, status: 'active', createdAt: now, lastUsedAt: null }, ...prev]);
      setApiKey(newKey);
      setApiKeyVisible(false);
      setApiMessage('API Key rotada correctamente.');
    } finally {
      setRotatingKey('');
    }
  };

  const loadRateLimit = useCallback(async () => {
    if (!token) {
      setRateLimit({ plan: 'enterprise', used: 0, limit: 10000, resetsAt: new Date(Date.now() + 3600 * 1000).toISOString() });
      return;
    }
    setRateLoading(true);
    setRateError('');
    try {
      const res = await developerService.getRateLimitStatus(token);
      const rl = res?.data?.rateLimit || res?.data || null;
      if (rl && typeof rl.used === 'number' && typeof rl.limit === 'number') {
        setRateLimit(rl);
      } else {
        setRateLimit({ plan: 'enterprise', used: 0, limit: 10000, resetsAt: new Date(Date.now() + 3600 * 1000).toISOString() });
      }
    } catch (e) {
      setRateError(e.message || 'No fue posible cargar el estado de rate limit');
      setRateLimit({ plan: 'enterprise', used: 0, limit: 10000, resetsAt: new Date(Date.now() + 3600 * 1000).toISOString() });
    } finally {
      setRateLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadApiKeys();
    loadRateLimit();
    (async () => {
      if (!token) {
        setUsage({ hedera: 0, xrp: 0, algorand: 0 });
        return;
      }
      try {
        const res = await developerService.getUsageAnalytics(token);
        const u = res?.data?.usage || res?.data || { hedera: 0, xrp: 0, algorand: 0 };
        setUsage(u);
      } catch {
        setUsage({ hedera: 0, xrp: 0, algorand: 0 });
      }
    })();
  }, [token, loadApiKeys, loadRateLimit]);

  const pct = rateLimit && rateLimit.limit > 0 ? Math.min(100, Math.round((rateLimit.used / rateLimit.limit) * 100)) : 0;
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return String(iso);
    }
  };

  const handleOpenVerification = () => {
    if (!verifyTokenId || !verifySerial) return;
    const url = verificationService.getVerificationUrl(verifyTokenId, verifySerial);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (demo) {
      setStats({ totalCredentials: 3, totalStudents: 2, issuedToday: 0 });
      return;
    }
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats('');
      try {
        const data = await issuanceService.getStatistics();
        setStats(data?.data?.statistics || data?.data || null);
      } catch (e) {
        setErrorStats(e.message);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [demo]);

  useEffect(() => {
    if (!qrPreviewOpen) return;
    try {
      const u = new URL(qrPreviewUrl);
      if (u.searchParams.get('format') === 'png') {
        u.searchParams.set('width', String(qrPngSize));
        setQrPreviewUrl(u.toString());
      }
    } catch {}
  }, [qrPngSize, qrPreviewOpen, qrPreviewUrl]);

  useEffect(() => {
    if (!qrPreviewOpen || !qrTokenId || !qrSerial) return;
    setQrMetaLoading(true);
    setQrMeta(null);
    verificationService.getCredentialHistory(qrTokenId, qrSerial)
      .then((data) => {
        setQrMeta(data?.data?.credential || null);
        try {
          const cred = data?.data?.credential || null;
          const attrs = cred?.metadata?.attributes || [];
          const txAttr = attrs.find(a => a.trait_type === 'TransactionId' || a.trait_type === 'TxId');
          const tx = data?.data?.transactionId || cred?.transactionId || cred?.metadata?.transactionId || txAttr?.value || '';
          setQrTxId(tx || '');
        } catch { setQrTxId(''); }
        setQrMetaLoading(false);
      })
      .catch(() => { setQrMetaLoading(false); });
  }, [qrPreviewOpen, qrTokenId, qrSerial]);

  const handleSignDPA = async () => {
    setDpaSigning(true);
    setDpaError('');
    try {
      const res = await institutionService.signDPA(token);
      if (res.success) {
        // Refresh session to update user.dpaAccepted
        await setSession(token);
        alert('Data Processing Agreement (DPA) signed successfully. You can now issue credentials.');
      }
    } catch (e) {
      setDpaError(e.message || 'Error signing DPA');
    } finally {
      setDpaSigning(false);
    }
  };

  return (
    <div className="container-responsive pb-10">
      <Toaster position="top-right" />
      
      {/* Real-time Dashboard Header */}
      <div className="mb-10">
          <div className="flex justify-between items-start mb-6">
              <div>
                  <h1 className="text-3xl font-extrabold text-white mb-2 font-display">
                      Panel de <span className="text-gradient">Control Institucional</span>
                  </h1>
                  <p className="text-slate-400">Gestiona y emite credenciales con respaldo blockchain.</p>
              </div>
              <button 
                  onClick={() => {
                      const code = `<script src="https://cdn.academicchain.com/widget.js" data-id="${user?.institutionId || 'demo'}"></script>`;
                      navigator.clipboard.writeText(code);
                      toast.success('Código copiado al portapapeles');
                  }}
                  className="hidden md:flex items-center gap-2 bg-slate-900/50 hover:bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/50 px-6 py-2 rounded-sm transition-all backdrop-blur-sm"
              >
                  <span className="text-xs uppercase tracking-widest font-medium">Copiar Widget</span>
              </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Main Metrics */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Emisiones Totales</h3>
                      <div className="text-4xl font-light text-cyan-400 my-3 font-display relative z-10">{dashboardMetrics.totalEmissions || 0}</div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider relative z-10">Certificados en MongoDB</p>
                  </div>
                  <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Anclajes Exitosos</h3>
                      <div className="text-4xl font-light text-emerald-400 my-3 font-display relative z-10">{dashboardMetrics.successfulAnchors || 0}</div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider relative z-10">Confirmados en Hedera/Arkhia</p>
                  </div>
                  <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all"></div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Tasa de Empleabilidad</h3>
                      <div className="text-4xl font-light text-purple-400 my-3 font-display relative z-10">{dashboardMetrics.employabilityRate || 0}%</div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider relative z-10">Alumnos contratados</p>
                  </div>
              </div>

              {/* Trust Badge Preview */}
              <div className="lg:col-span-1">
                  <div className="mb-2 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vista Pública (Widget)</h3>
                      <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-900/50">Live</span>
                  </div>
                  <TrustBadge institutionId={user?.institutionId || 'demo-inst'} />
              </div>
          </div>

          <div className="glass-panel p-6 border border-slate-700/50 mb-8">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Flujo de Certificación en Tiempo Real</h3>
                  <button 
                      onClick={simulateEmission}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors"
                  >
                      Simular Emisión
                  </button>
              </div>
              <CertificationStepper 
                  currentStep={currentCertificationStep} 
                  transactionId={latestTransactionId} 
              />
          </div>
      </div>
      
      {!demo && user && !user.dpaAccepted && (
        <div className="mb-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-500/5 border border-amber-500/20 backdrop-blur-sm rounded-sm"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
          <div className="relative p-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Acción Requerida: Firma de Acuerdo de Procesamiento de Datos (DPA)
            </h3>
            <div className="text-xs text-amber-200/80 font-light tracking-wide space-y-2 max-w-4xl">
              <p>
                Para cumplir con las normativas internacionales (GDPR, SOC2) y el modelo de "Transferencia de Responsabilidad", debe firmar digitalmente el acuerdo de procesamiento de datos antes de emitir credenciales.
              </p>
              <p>
                Al firmar, usted confirma que su institución cuenta con el consentimiento legal de los estudiantes para la emisión de sus títulos en blockchain.
              </p>
              {dpaError && <div className="text-red-400 font-bold bg-red-900/20 p-2 border border-red-500/20 rounded-sm inline-block">{dpaError}</div>}
              <div className="mt-4">
                <button
                  onClick={handleSignDPA}
                  disabled={dpaSigning}
                  className={`bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/50 px-6 py-2 rounded-sm text-xs uppercase tracking-widest transition-all ${dpaSigning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}
                >
                  {dpaSigning ? 'Firmando...' : 'Firmar DPA Digitalmente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {demo && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="card p-4">
            <div className="font-semibold mb-2">Modo Demo (Testnet)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Token demo</label>
                <div className="flex gap-2 mt-1">
                  <input value={demoTokenId} onChange={e => setDemoTokenId(e.target.value)} placeholder="0.0.xxxxxx" className="input" />
                  <button className="btn-secondary" disabled={creatingToken} onClick={handleCreateToken}>Crear token demo</button>
                </div>
                {tokenMessage && <div className="text-green-700 text-sm mt-1">{tokenMessage}</div>}
                {tokenError && <div className="text-red-600 text-sm mt-1">{tokenError}</div>}
              </div>
              <div>
                <label className="text-sm">Unique Hash</label>
                <div className="flex gap-2 mt-1">
                  <input value={demoUniqueHash} onChange={e => setDemoUniqueHash(e.target.value)} placeholder="hash único" className="input" />
                  <button type="button" className="btn-secondary" onClick={() => setDemoUniqueHash(Math.random().toString(36).slice(2))}>Generar</button>
                </div>
                <label className="text-sm mt-3">IPFS URI</label>
                <div className="flex gap-2 mt-1">
                  <input value={demoIpfsURI} onChange={e => setDemoIpfsURI(e.target.value)} placeholder="ipfs://CID o URL" className="input" />
                  <button type="button" className="btn-secondary" onClick={() => setDemoIpfsURI('ipfs://QmDemoCid')}>Usar CID de ejemplo</button>
                  <button type="button" className="btn-secondary" onClick={() => setDemoIpfsURI('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}>Usar PDF de ejemplo</button>
                </div>
                <label className="text-sm mt-3">Imagen (ipfs://CID)</label>
                <input value={demoImageCid} onChange={e => setDemoImageCid(e.target.value)} placeholder="ipfs CID" className="input mt-1" />
                <div className="text-xs text-gray-500 mt-1">Se usará en metadata.image. Si se omite, aplica jerarquía (logo → global).</div>
                <label className="text-sm mt-3">Recipient AccountId (opcional)</label>
                <input value={demoRecipientAccountId} onChange={e => setDemoRecipientAccountId(e.target.value)} placeholder="0.0.account" className="input mt-1" />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn-primary" disabled={demoLoading || !demoTokenId || !demoIpfsURI} onClick={handleDemoIssuance}>Emitir en testnet</button>
              {demoIssuanceMsg && <div className="text-green-700 text-sm mt-2">{demoIssuanceMsg}</div>}
              {demoIssuanceErr && <div className="text-red-600 text-sm mt-2">{demoIssuanceErr}</div>}
            </div>
            <div className="mt-3">
              <button className="btn-secondary" onClick={async () => {
                setDemoPinMsg(''); setDemoPinErr('');
                try {
                  const data = await demoService.pinCredential({
                    degree: tokenMemo || 'Demo Degree',
                    studentName: 'Demo Student',
                    tokenId: demoTokenId || undefined,
                    uniqueHash: demoUniqueHash || undefined,
                    image: demoImageCid ? `ipfs://${String(demoImageCid).replace('ipfs://','')}` : undefined,
                  });
                  setDemoIpfsURI(data?.data?.ipfsURI || '');
                  setDemoPinMsg(data?.data?.pinned ? 'Documento demo creado en IPFS' : 'Usando documento de ejemplo');
                } catch (e) {
                  setDemoPinErr(e.message);
                }
              }}>Generar documento demo (IPFS)</button>
              {demoPinMsg && <div className="text-green-700 text-sm mt-2">{demoPinMsg}</div>}
              {demoPinErr && <div className="text-red-600 text-sm mt-2">{demoPinErr}</div>}
            </div>
          </div>
          {demoIssued.length > 0 && (
            <div className="mt-6">
              <div className="font-semibold mb-2">Últimas credenciales emitidas (demo)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoIssued.map(item => {
                  const link = `${window.location.origin}/#/verificar?tokenId=${encodeURIComponent(item.tokenId)}&serialNumber=${encodeURIComponent(item.serialNumber)}`;
                  return (
                    <div key={item.nftId} className="card">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-700">{item.nftId}</div>
                          <div className="text-xs text-gray-500">{item.createdAt}</div>
                        </div>
                        <span className="badge badge-success text-xs">emitida</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-center">
                          <QRCode value={link} size={110} />
                        </div>
                        <div className="text-sm break-all">
                          <div>
                            <span className="font-medium">Verificación:</span>
                            <a href={link} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 hover:underline">{link}</a>
                          </div>
                          <div className="mt-2">
                            {(item.ipfsURI || '').startsWith('ipfs://') ? (
                              <span className="badge badge-success">IPFS</span>
                            ) : (
                              <span className="badge badge-info">Demo PDF</span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button className="btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(link)}>Copiar Link</button>
                            <a className="btn-primary btn-sm" href={item.hashscanUrl} target="_blank" rel="noreferrer">Ver en HashScan</a>
                            <a className="btn-secondary btn-sm" href={toGateway(item.ipfsURI)} target="_blank" rel="noreferrer">Ver documento</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Estado del Sistema</div>
          {loadingStats && <div className="text-xs text-cyan-400 animate-pulse">Sincronizando métricas...</div>}
          {errorStats && <div className="text-xs text-red-400">{errorStats}</div>}
          {!loadingStats && !errorStats && (
            <div className="text-xs text-slate-400 font-mono break-words bg-slate-950/50 p-3 rounded border border-slate-800/50">
              {stats ? JSON.stringify(stats, null, 2) : 'Sin datos de telemetría'}
            </div>
          )}
        </div>
        <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm md:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Conectividad & API</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="text-xs text-emerald-400 font-medium tracking-wide">Gateway Global Activo</span>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-cyan-900/10 hover:bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/50 rounded-sm text-[10px] uppercase tracking-widest transition-all"
              disabled={apiGenerating} 
              onClick={handleGenerateApiKey}
            >
              {apiGenerating ? 'Generando...' : 'Nueva API Key'}
            </button>
          </div>

          {apiMessage && <div className="mb-4 text-xs text-emerald-400 bg-emerald-900/10 border border-emerald-500/20 p-2 rounded-sm">{apiMessage}</div>}
          
          {apiKey && (
            <div className="mb-6 p-4 rounded-sm border border-cyan-500/20 bg-cyan-950/10 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-cyan-500 text-4xl">
                 KEY
              </div>
              <div className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-2">x-api-key (Secret)</div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="font-mono text-sm text-cyan-300 break-all bg-slate-950/50 px-3 py-1.5 rounded border border-cyan-900/30 flex-1">
                  {apiKeyVisible ? apiKey : maskKey(apiKey)}
                </div>
                <button className="text-slate-400 hover:text-cyan-400 transition-colors text-xs uppercase tracking-wider" onClick={() => setApiKeyVisible(v => !v)}>
                  {apiKeyVisible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="text-slate-400 hover:text-cyan-400 transition-colors text-xs uppercase tracking-wider" onClick={() => navigator.clipboard.writeText(apiKey)}>Copiar</button>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">Credencial de acceso de alto privilegio. Manténgala segura.</div>
            </div>
          )}

          <div className="mb-6">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Rate Limit (Enterprise)</div>
            {rateLoading ? (
              <div className="text-xs text-slate-500 animate-pulse">Calculando cuota...</div>
            ) : (
              <div>
                {rateError && <div className="text-xs text-red-400 mb-2">{rateError}</div>}
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                   <span>{rateLimit?.used || 0} / {rateLimit?.limit || 0} reqs</span>
                   <span>{pct}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                {rateLimit?.resetsAt && <div className="text-[10px] text-slate-600 mt-1 text-right">Reinicio: {formatDate(rateLimit.resetsAt)}</div>}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Historial de Llaves</div>
            {apiKeysLoading ? (
              <div className="text-xs text-slate-500">Cargando...</div>
            ) : apiKeysError ? (
              <div className="text-xs text-red-400">{apiKeysError}</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-xs text-slate-600 italic">No hay llaves activas</div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((k) => {
                  const masked = maskKey(k.apiKey || '');
                  const s = k.status || 'active';
                  const isActive = s === 'active';
                  const isRevoking = revokingKey === k.apiKey;
                  const isRotating = rotatingKey === k.apiKey;
                  return (
                    <div key={k.apiKey} className="flex items-center justify-between p-3 rounded-sm border border-slate-800 bg-slate-950/30 hover:border-slate-700 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-slate-300 break-all">{masked}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                           {s.toUpperCase()} • {formatDate(k.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button 
                            className={`px-3 py-1 text-[10px] uppercase tracking-wider border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900/50 rounded-sm transition-all ${!isActive ? 'opacity-20 pointer-events-none' : ''}`} 
                            onClick={() => handleRevokeApiKey(k.apiKey)} 
                            disabled={!isActive || isRevoking}
                        >
                          {isRevoking ? '...' : 'Revocar'}
                        </button>
                        <button 
                            className={`px-3 py-1 text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 rounded-sm transition-all ${!isActive ? 'opacity-20 pointer-events-none' : ''}`} 
                            onClick={() => handleRotateApiKey(k.apiKey)} 
                            disabled={!isActive || isRotating}
                        >
                          {isRotating ? '...' : 'Rotar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Branding Institucional</div>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer group">
                  <div className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-sm text-xs transition-all flex items-center gap-2">
                      <span>Subir Logo (IPFS)</span>
                  </div>
                  <input type="file" className="hidden" accept="image/png,image/svg+xml" onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    if (!f) return;
                    try {
                      const uri = await issuanceService.uploadToIPFS(f);
                      setInstitutionalLogoUrl(toGateway(uri));
                    } catch {}
                  }} />
              </label>
              {institutionalLogoUrl && <div className="p-1 bg-white/5 rounded border border-white/10"><img src={institutionalLogoUrl} alt="Logo" className="h-8 w-8 object-contain" /></div>}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="flex justify-between items-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">SLA & On-Premise</div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 px-2 py-1 bg-slate-900 rounded border border-slate-800">Local: Bloqueado</span>
                    <a className="text-[10px] text-cyan-500 hover:text-cyan-400 hover:underline" href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank" rel="noreferrer">Ver SLA</a>
                </div>
            </div>
          </div>
        </div>
          <div className="mt-8">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Analíticas por Red</div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-12 h-12 text-cyan-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hedera Hashgraph</div>
                <div className="text-2xl font-bold text-slate-200 font-mono">{usage.hedera || 0}</div>
                <div className="text-[10px] text-cyan-500/70 mt-1">Consenso Primario</div>
              </div>
              <div className="p-4 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-12 h-12 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 15l-5-5 5-5 5 5-5 5z"/></svg>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">XRP Ledger</div>
                <div className="text-2xl font-bold text-slate-200 font-mono">{usage.xrp || 0}</div>
                <div className="text-[10px] text-indigo-500/70 mt-1">Anclaje Secundario</div>
              </div>
              <div className="p-4 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-12 h-12 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Algorand</div>
                <div className="text-2xl font-bold text-slate-200 font-mono">{usage.algorand || 0}</div>
                <div className="text-[10px] text-emerald-500/70 mt-1">Respaldo Terciario</div>
              </div>
            </div>
            
            <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
              {(() => {
                const labels = ['Hedera', 'XRP', 'Algorand'];
                const values = [usage.hedera || 0, usage.xrp || 0, usage.algorand || 0];
                const target = Math.max(...values, 1);
                const gradientFactory = (ctx) => {
                  const g = ctx.createLinearGradient(0, 0, 0, 200);
                  g.addColorStop(0, 'rgba(6,182,212,0.5)'); // Cyan
                  g.addColorStop(1, 'rgba(15,23,42,0.0)');  // Slate 900 transparent
                  return g;
                };
                const data = {
                  labels,
                  datasets: [
                    {
                      type: 'bar',
                      label: 'Uso',
                      data: values,
                      backgroundColor: (context) => {
                        const { ctx } = context.chart;
                        return gradientFactory(ctx);
                      },
                      borderColor: 'rgba(34,211,238,0.8)', // Cyan 400
                      borderWidth: 1,
                      borderRadius: 2,
                      hoverBackgroundColor: 'rgba(34,211,238,0.3)'
                    },
                    {
                      type: 'line',
                      label: 'Nivel óptimo',
                      data: [target, target, target],
                      borderColor: 'rgba(52,211,153,0.5)', // Emerald 400
                      pointBackgroundColor: 'rgba(52,211,153,1)',
                      borderDash: [5, 5],
                      tension: 0.1,
                      pointRadius: 2
                    }
                  ]
                };
                const options = {
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 1000 },
                  plugins: { 
                    legend: { display: false }, 
                    tooltip: { 
                      enabled: true,
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      titleColor: '#94a3b8',
                      bodyColor: '#e2e8f0',
                      borderColor: 'rgba(30,41,59,0.5)',
                      borderWidth: 1,
                      padding: 10,
                      cornerRadius: 2
                    } 
                  },
                  scales: {
                    x: { 
                      grid: { display: false, drawBorder: false },
                      ticks: { color: '#64748b', font: { size: 10, family: 'monospace' } }
                    },
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(51,65,85,0.2)', drawBorder: false },
                      ticks: { color: '#64748b', font: { size: 10, family: 'monospace' } }
                    }
                  }
                };
                const usedNetworks = ['hedera','xrp','algorand'].filter(n => (values[['Hedera','XRP','Algorand'].indexOf(n)] || 0) > 0).length;
                const securityPct = usedNetworks === 0 ? 0 : Math.round((usedNetworks / 3) * 100);
                const levelLabel = usedNetworks >= 3 ? 'BLINDAJE TOTAL' : (usedNetworks === 2 ? 'SEGURIDAD AVANZADA' : (usedNetworks === 1 ? 'SEGURIDAD BASE' : 'SIN ACTIVIDAD'));
                const doughnutData = {
                  labels: ['Seguridad', 'Riesgo'],
                  datasets: [{ 
                    data: [securityPct, 100 - securityPct], 
                    backgroundColor: ['rgba(34,211,238,0.8)', 'rgba(30,41,59,0.5)'], 
                    borderWidth: 0,
                    cutout: '85%'
                  }]
                };
                const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 1500 } };
                const tooltipMsg = securityPct >= 100
                  ? 'MÁXIMO ESTÁNDAR GLOBAL. Triple redundancia inmutable (H + X + A). Protección contra fallos críticos y auditoría internacional inmediata.'
                  : (securityPct >= 66
                    ? 'DOBLE CONSENSO DISTRIBUIDO (Hedera + XRP). Alta resiliencia y verificación dual.'
                    : (securityPct >= 33
                      ? 'CERTIFICACIÓN INMUTABLE en red Hedera Hashgraph. Resistencia estándar.'
                      : 'SIN BLINDAJE ACTIVO. Inicia emisión para activar seguridad.'));
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 h-64">
                      <Bar data={data} options={options} />
                    </div>
                    <div className="h-64 flex flex-col items-center justify-center border-l border-slate-800/50 pl-8">
                      <div className="w-32 h-32 relative group cursor-help">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <div className="text-3xl font-bold text-white font-mono">{securityPct}%</div>
                        </div>
                        
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-sm shadow-xl text-[10px] text-slate-300 leading-relaxed text-center">
                            {tooltipMsg}
                          </div>
                          <div className="w-2 h-2 bg-slate-700 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${
                          securityPct >= 100 ? 'text-emerald-400' : 
                          securityPct >= 66 ? 'text-cyan-400' : 
                          securityPct >= 33 ? 'text-indigo-400' : 'text-slate-500'
                        }`}>
                          {levelLabel}
                        </div>
                        <div className="text-[10px] text-slate-500">Nivel de Seguridad Criptográfica</div>
                      </div>

                      <button className="mt-6 text-[10px] uppercase tracking-wider text-slate-400 hover:text-cyan-400 border-b border-dashed border-slate-600 hover:border-cyan-500 pb-0.5 transition-colors" onClick={async () => {
                        try {
                          const doc = new jsPDF();
                          // ... PDF generation logic (simplified for brevity or kept same) ...
                          if (institutionalLogoUrl) {
                             try {
                               const r = await fetch(institutionalLogoUrl);
                               const b = await r.blob();
                               const reader = new FileReader();
                               await new Promise((res, rej) => { reader.onload = () => res(); reader.onerror = rej; reader.readAsDataURL(b); });
                               doc.addImage(reader.result, 'PNG', 10, 10, 20, 20);
                             } catch {}
                           }
                           doc.setFontSize(14);
                           doc.text('ACADEMIC CHAIN: ENTERPRISE REPORT', 10, institutionalLogoUrl ? 40 : 20);
                           doc.setFontSize(10);
                           doc.text('Triple Blindaje Blockchain (Hedera + XRP + Algorand)', 10, institutionalLogoUrl ? 50 : 30);
                           doc.save('ACL-Enterprise-Report.pdf');
                        } catch {}
                      }}>
                        Descargar Reporte PDF
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="mt-8">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">ACL Labs: Simulador de Emisión</div>
            <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  className="px-4 py-3 bg-cyan-900/10 hover:bg-cyan-900/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-sm text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                  disabled={labLoading || !apiKey} 
                  onClick={async () => {
                    setLabLoading(true); setLabError(''); setLabMessage('');
                    try {
                      const res = await developerService.certifyStandard(apiKey, {});
                      setLabMessage(res?.data?.message || 'Emisión Standard realizada');
                      const r = await developerService.getUsageAnalytics(token);
                      setUsage(r?.data?.usage || r?.data || usage);
                    } catch (e) {
                      setLabError(e.message || 'Error en emisión Standard');
                    } finally {
                      setLabLoading(false);
                    }
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-shadow"></span>
                  Emitir Standard (H)
                </button>
                <button 
                  className="px-4 py-3 bg-indigo-900/10 hover:bg-indigo-900/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-sm text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                  disabled={labLoading || !apiKey} 
                  onClick={async () => {
                    setLabLoading(true); setLabError(''); setLabMessage('');
                    try {
                      const res = await developerService.certifyDual(apiKey, {});
                      setLabMessage(res?.data?.message || 'Emisión Dual realizada');
                      const r = await developerService.getUsageAnalytics(token);
                      setUsage(r?.data?.usage || r?.data || usage);
                    } catch (e) {
                      setLabError(e.message || 'Error en emisión Dual');
                    } finally {
                      setLabLoading(false);
                    }
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-shadow"></span>
                  Emitir Dual (H+X)
                </button>
                <button 
                  className="px-4 py-3 bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-sm text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                  disabled={labLoading || !apiKey} 
                  onClick={async () => {
                    setLabLoading(true); setLabError(''); setLabMessage('');
                    try {
                      const res = await developerService.certifyTriple(apiKey, {});
                      setLabMessage(res?.data?.message || 'Emisión Triple realizada');
                      const r = await developerService.getUsageAnalytics(token);
                      setUsage(r?.data?.usage || r?.data || usage);
                    } catch (e) {
                      setLabError(e.message || 'Error en emisión Triple');
                    } finally {
                      setLabLoading(false);
                    }
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-shadow"></span>
                  Emitir Triple (H+X+A)
                </button>
              </div>
              
              <div className="mt-4 flex flex-col items-center">
                {labLoading && <div className="text-xs text-cyan-400 animate-pulse font-mono">:: PROCESANDO TRANSACCIÓN DISTRIBUIDA ::</div>}
                {labMessage && <div className="text-xs text-emerald-400 font-mono border border-emerald-500/30 bg-emerald-900/20 px-3 py-1 rounded-sm">{labMessage}</div>}
                {labError && <div className="text-xs text-red-400 font-mono border border-red-500/30 bg-red-900/20 px-3 py-1 rounded-sm">{labError}</div>}
                {!apiKey && <div className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Genera una API Key para habilitar las pruebas de laboratorio</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex justify-between items-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Total Credenciales</div>
            <div className="text-xl font-bold text-slate-200 font-mono">{meta.total || 0}</div>
          </div>
          <div className="p-4 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex justify-between items-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Página Actual</div>
            <div className="text-xl font-bold text-slate-200 font-mono">{page}</div>
          </div>
        </div>

      </div>
      <div className="mt-8">
        <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Crear Token Académico (HTS)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" 
              placeholder="Nombre del Token" 
              value={tokenName} 
              onChange={(e) => setTokenName(e.target.value)} 
              disabled={creatingToken || demo} 
            />
            <input 
              className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" 
              placeholder="Símbolo (p.ej. ACAD)" 
              value={tokenSymbol} 
              onChange={(e) => setTokenSymbol(e.target.value)} 
              disabled={creatingToken || demo} 
            />
            <input 
              className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" 
              placeholder="Memo (opcional)" 
              value={tokenMemo} 
              onChange={(e) => setTokenMemo(e.target.value)} 
              disabled={creatingToken || demo} 
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button 
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={creatingToken || demo || !tokenName || !tokenSymbol} 
              onClick={handleCreateToken}
            >
              {creatingToken ? 'Creando...' : 'Crear Token HTS'}
            </button>
            {tokenMessage && <div className="text-xs text-emerald-400 font-mono">{tokenMessage}</div>}
            {tokenError && <div className="text-xs text-red-400 font-mono">{tokenError}</div>}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="p-6 rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Verificar Credencial (Hedera + XRP)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" 
              placeholder="Token ID (p.ej. 0.0.x)" 
              value={verifyTokenId} 
              onChange={(e) => setVerifyTokenId(e.target.value)} 
            />
            <input 
              className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" 
              placeholder="Serial Number" 
              value={verifySerial} 
              onChange={(e) => setVerifySerial(e.target.value)} 
            />
            <button 
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-600 hover:border-cyan-500/50 text-xs font-bold uppercase tracking-widest rounded-sm transition-all disabled:opacity-50" 
              onClick={handleOpenVerification} 
              disabled={!verifyTokenId || !verifySerial}
            >
              Abrir Verificación
            </button>
          </div>
          <div className="text-[10px] text-slate-600 mt-2 font-mono">
            :: Se abrirá una página con el estado en Hedera y el anclaje XRP ::
          </div>
        </div>
      </div>
      <div className="mt-8">
        <IssueTitleForm demo={demo} />
      </div>
      <div className="mt-8">
        <BatchIssuance demo={demo} />
      </div>
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registro de Emisiones</h2>
          <a className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-sm border border-slate-700 transition-all ${demo ? 'pointer-events-none opacity-50' : ''}`} target="_blank" rel="noreferrer" href={`${import.meta.env.VITE_API_URL}/api/universities/credentials?${new URLSearchParams({ ...(filterTokenId ? { tokenId: filterTokenId } : {}), ...(filterAccountId ? { accountId: filterAccountId } : {}), format: 'csv' }).toString()}`}>Exportar CSV</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input value={filterTokenId} onChange={(e) => setFilterTokenId(e.target.value)} placeholder="Filtrar por Token ID" className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" disabled={demo} />
          <input value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} placeholder="Filtrar por Cuenta Hedera" className="bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono" disabled={demo} />
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all disabled:opacity-50 w-full md:w-auto" disabled={demo} onClick={() => {
              loadCredentials({
                page: 1,
                tokenId: filterTokenId || undefined,
                accountId: filterAccountId || undefined
              });
            }}>
              Buscar
            </button>
          </div>
        </div>
        {loadingCreds && <div className="text-xs text-cyan-400 animate-pulse font-mono mb-4">:: CARGANDO REGISTROS ::</div>}
        {errorCreds && <div className="text-xs text-red-400 font-mono mb-4 border border-red-500/30 bg-red-900/20 px-3 py-1 rounded-sm">{errorCreds}</div>}
        {!loadingCreds && credentials.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <input
                className="w-full md:w-96 bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 placeholder-slate-600 font-mono"
                placeholder="Buscar por nombre, hash, tokenId, serial o id"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select className="w-48 bg-slate-950/50 border border-slate-700 text-slate-300 text-xs rounded-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50 font-mono" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todas</option>
                <option value="verified">Verificadas</option>
                <option value="pending">Pendientes</option>
                <option value="revoked">Revocadas</option>
                <option value="confirmed">Confirmadas</option>
              </select>
            </div>
            {(() => {
              const q = String(searchQuery || '').toLowerCase().trim();
              const base = q
                ? credentials.filter(x => {
                    const name = String(x.studentName || '').toLowerCase();
                    const title = String(x.title || '').toLowerCase();
                    const tokenId = String(x.tokenId || x.id || '').toLowerCase();
                    const serial = String(x.serialNumber || '').toLowerCase();
                    const hash = String(x.uniqueHash || '').toLowerCase();
                    const ipfs = String(x.ipfsURI || '').toLowerCase();
                    const hederaTx = String(x.externalProofs?.hederaTx || '').toLowerCase();
                    const xrpTx = String(x.externalProofs?.xrpTxHash || '').toLowerCase();
                    const algoTx = String(x.externalProofs?.algoTxId || '').toLowerCase();
                    return [name, title, tokenId, serial, hash, ipfs, hederaTx, xrpTx, algoTx].some(v => v.includes(q));
                  })
                : credentials;
              const visible = base.filter(x => {
                const st = String(x.status || '').toLowerCase();
                if (statusFilter === 'all') return true;
                if (statusFilter === 'verified') return st === 'verified';
                if (statusFilter === 'pending') return st === 'pending';
                if (statusFilter === 'revoked') return st === 'revoked';
                if (statusFilter === 'confirmed') return st && st !== 'verified' && st !== 'pending' && st !== 'revoked';
                return true;
              });
              const revokedCount = visible.filter(x => String(x.status || '').toLowerCase() === 'revoked').length;
              return (
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono mb-4">
                  <span className="px-2 py-1 rounded-sm bg-red-900/10 text-red-400 border border-red-900/30" title="Totales (global)">
                    Revocadas (Total): <strong>{globalStats.revoked}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-sm bg-purple-900/10 text-purple-400 border border-purple-900/30" title="Totales (global)">
                    Eliminadas (Total): <strong>{globalStats.deleted}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-sm bg-emerald-900/10 text-emerald-400 border border-emerald-900/30" title="Totales (global)">
                    Verificadas (Total): <strong>{globalStats.verified}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-sm bg-amber-900/10 text-amber-400 border border-amber-900/30" title="Totales (global)">
                    Pendientes (Total): <strong>{globalStats.pending}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-sm bg-slate-800 text-slate-400 border border-slate-700" title="Página actual">
                    En lista — Revocadas: <strong>{revokedCount}</strong>, Eliminadas (sesión): <strong>{deletedCount}</strong>
                  </span>
                </div>
              );
            })()}
            <div className="hidden md:block overflow-x-auto rounded-sm border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
              <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Token</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serial</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">IPFS</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hedera Tx</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">XRP Tx</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Algorand Tx</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">SHA-256</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {(searchQuery ? credentials.filter(x => {
                  const q = String(searchQuery || '').toLowerCase().trim();
                  const name = String(x.studentName || '').toLowerCase();
                  const title = String(x.title || '').toLowerCase();
                  const tokenId = String(x.tokenId || x.id || '').toLowerCase();
                  const serial = String(x.serialNumber || '').toLowerCase();
                  const hash = String(x.uniqueHash || '').toLowerCase();
                  const ipfs = String(x.ipfsURI || '').toLowerCase();
                  const hederaTx = String(x.externalProofs?.hederaTx || '').toLowerCase();
                  const xrpTx = String(x.externalProofs?.xrpTxHash || '').toLowerCase();
                  const algoTx = String(x.externalProofs?.algoTxId || '').toLowerCase();
                  const match = [name, title, tokenId, serial, hash, ipfs, hederaTx, xrpTx, algoTx].some(v => v.includes(q));
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
                })).map((c) => (
                  <tr key={`${c.tokenId}-${c.serialNumber}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono">{c.tokenId}</td>
                    <td className="px-4 py-3 font-mono">{c.serialNumber}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-[10px] uppercase tracking-wider text-cyan-400 hover:text-cyan-300 hover:underline"
                        onClick={() => {
                          setDocUrl(toGateway(c.ipfsURI));
                          setDocOpen(true);
                        }}
                      >
                        Ver
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {c.externalProofs?.hederaTx ? (
                        <span title={c.externalProofs.hederaTx} className="text-slate-400">
                          {c.externalProofs.hederaTx.slice(0, 10)}...
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash ? (
                        <a
                          href={`https://testnet.xrplexplorer.com/tx/${c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 hover:underline"
                          title={c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash}
                        >
                          {(c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash).slice(0, 8)}...
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {c.externalProofs?.algoTxId ? (
                        <span title={c.externalProofs.algoTxId} className="text-emerald-400">
                          {c.externalProofs.algoTxId.slice(0, 10)}...
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {c.uniqueHash ? (
                        <span title={c.uniqueHash}>
                          {c.uniqueHash.slice(0, 10)}...
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-[10px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400" disabled={demo} onClick={() => handleRequestVerification(c)}>
                          Verificar
                        </button>
                        <button className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400" disabled={demo || String(c.status).toLowerCase() === 'revoked'} onClick={() => handleRevokeClick(c)}>
                          {String(c.status).toLowerCase() === 'revoked' ? 'Revocada' : 'Revocar'}
                        </button>
                        <button className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-red-400" disabled={demo} onClick={() => handleDeleteIssuedCredential(c)}>
                          Borrar
                        </button>
                        <button className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-cyan-400" disabled={demo} onClick={() => {
                          const base = import.meta.env.VITE_API_URL;
                          const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=png&width=${qrPngSize}`;
                          setQrPreviewUrl(u);
                          setQrTokenId(c.tokenId);
                          setQrSerial(String(c.serialNumber));
                          setQrIssuerId(String(c.universityId || ''));
                          setQrIpfsURI(c.ipfsURI || '');
                          setQrPreviewOpen(true);
                        }}>QR</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {(searchQuery ? credentials.filter(x => {
                const q = String(searchQuery || '').toLowerCase().trim();
                const name = String(x.studentName || '').toLowerCase();
                const title = String(x.title || '').toLowerCase();
                const tokenId = String(x.tokenId || x.id || '').toLowerCase();
                const serial = String(x.serialNumber || '').toLowerCase();
                const hash = String(x.uniqueHash || '').toLowerCase();
                const ipfs = String(x.ipfsURI || '').toLowerCase();
                const hederaTx = String(x.externalProofs?.hederaTx || '').toLowerCase();
                const xrpTx = String(x.externalProofs?.xrpTxHash || '').toLowerCase();
                const algoTx = String(x.externalProofs?.algoTxId || '').toLowerCase();
                const match = [name, title, tokenId, serial, hash, ipfs, hederaTx, xrpTx, algoTx].some(v => v.includes(q));
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
              })).map((c) => (
                <div key={`${c.tokenId}-${c.serialNumber}`} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-sm p-4 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-mono text-xs text-cyan-400 max-w-[60%] overflow-wrap break-all">{c.tokenId}</div>
                    <div className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2 py-1 rounded-sm">#{c.serialNumber}</div>
                  </div>
                  <div className="space-y-2 text-[10px] text-slate-400 break-all font-mono">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[9px]">Hedera</span>
                      {c.externalProofs?.hederaTx ? (
                        <span title={c.externalProofs.hederaTx} className="text-slate-300">
                          {c.externalProofs.hederaTx.slice(0, 20)}...
                        </span>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[9px]">XRP</span>
                      {c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash ? (
                        <a
                          href={`https://testnet.xrplexplorer.com/tx/${c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          title={c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash}
                        >
                          {(c.externalProofs?.xrpTxHash || c.xrpAnchor?.xrpTxHash).slice(0, 20)}...
                        </a>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[9px]">Algorand</span>
                      {c.externalProofs?.algoTxId ? (
                        <span title={c.externalProofs.algoTxId} className="text-emerald-400">
                          {c.externalProofs.algoTxId.slice(0, 20)}...
                        </span>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[9px]">SHA-256</span>
                      {c.uniqueHash ? (
                        <span title={c.uniqueHash} className="text-slate-300">
                          {c.uniqueHash.slice(0, 20)}...
                        </span>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-sm transition-all" disabled={demo} onClick={() => handleRequestVerification(c)}>Verificar</button>
                    <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800" onClick={() => { setDocUrl(toGateway(c.ipfsURI)); setDocOpen(true); }}>Documento</button>
                    <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-sm transition-all" disabled={demo} onClick={() => handleDeleteIssuedCredential(c)}>Borrar</button>
                    <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800" disabled={demo} onClick={() => {
                      const base = import.meta.env.VITE_API_URL || '';
                      const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=png&width=${qrPngSize}`;
                      setQrPreviewUrl(u);
                      setQrTokenId(c.tokenId);
                      setQrSerial(String(c.serialNumber));
                      setQrIssuerId(String(c.universityId || ''));
                      setQrIpfsURI(c.ipfsURI || '');
                      setQrPreviewOpen(true);
                    }}>QR</button>
                    <a className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-sm transition-all text-center" href={`${(import.meta.env.VITE_API_URL || '')}/api/verification/credential-history/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Historial</a>
                    <a className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-sm transition-all text-center" href={`${(import.meta.env.VITE_API_URL || '')}/api/verification/verify/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Dual</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t border-slate-800 gap-4" role="navigation" aria-label="Controles de paginación">
              <div className="flex items-center gap-2">
                <button aria-label="Primera página" aria-disabled={demo || page <= 1 || loadingCreds} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-transparent hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  loadCredentials({ page: 1 });
                }}>Inicio</button>
                <button aria-label="Página anterior" aria-disabled={demo || page <= 1 || loadingCreds} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-transparent hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  loadCredentials({ page: page - 1 });
                }}>Anterior</button>
                <button aria-label="Página siguiente" aria-disabled={demo || loadingCreds || !meta.hasMore} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={demo || loadingCreds || !meta.hasMore} onClick={() => {
                  loadCredentials({ page: page + 1 });
                }}>Siguiente</button>
                <button aria-label="Última página" aria-disabled={demo || loadingCreds || page >= meta.pages} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-transparent hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={demo || loadingCreds || page >= meta.pages} onClick={() => {
                  loadCredentials({ page: meta.pages });
                }}>Fin</button>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono" role="status" aria-live="polite">{meta.from}-{meta.to} de {meta.total} • Pág {page}/{meta.pages}</div>
              <div className="flex items-center gap-2">
                <select aria-label="Límite por página" className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 p-1.5 outline-none" value={limit} disabled={demo} onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10) || 10;
                  loadCredentials({ page: 1, limit: newLimit });
                }}>
                  <option value={5}>5 / pág</option>
                  <option value={10}>10 / pág</option>
                  <option value={20}>20 / pág</option>
                  <option value={50}>50 / pág</option>
                </select>
                <select aria-label="Orden" className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 p-1.5 outline-none" value={sort} disabled={demo} onChange={(e) => {
                  const newSort = e.target.value;
                  loadCredentials({ page: 1, sort: newSort });
                }}>
                  <option value="desc">Recientes</option>
                  <option value="asc">Antiguos</option>
                </select>
                <div className="flex items-center gap-1">
                  <input aria-label="Ir a página" className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono rounded-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 p-1.5 w-12 text-center outline-none" type="number" min={1} max={meta.pages || 1} value={targetPage} disabled={demo} onChange={(e) => setTargetPage(e.target.value)} placeholder="#" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const tp = Number(targetPage);
                      if (!tp || tp < 1 || tp > (meta.pages || 1) || loadingCreds) return;
                      loadCredentials({ page: tp });
                    }
                  }} />
                  <button aria-label="Ir a página" aria-disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800 disabled:opacity-50" disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} onClick={() => {
                    const tp = Number(targetPage);
                    loadCredentials({ page: tp });
                  }}>Ir</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {!loadingCreds && credentials.length === 0 && (
          <div className="p-8 text-center border border-slate-800 rounded-sm bg-slate-900/20 backdrop-blur-sm">
            <div className="text-slate-500 text-sm font-light">No hay credenciales emitidas en este criterio</div>
          </div>
        )}
        <DocumentViewer open={docOpen} src={docUrl} title="Documento" onClose={() => setDocOpen(false)} />
        {qrPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <div className="absolute inset-0" onClick={() => setQrPreviewOpen(false)} />
            <div className="relative bg-slate-900 border border-slate-800 rounded-sm shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="font-bold text-slate-200 text-lg tracking-wide uppercase">Código QR</div>
                <button className="text-slate-400 hover:text-cyan-400 transition-colors" onClick={() => setQrPreviewOpen(false)}>✕</button>
              </div>
              {institutionalLogoUrl && (
                <div className="flex justify-center mb-4">
                  <img alt="Logo Institucional" src={institutionalLogoUrl} className="h-12 w-12 rounded bg-white/5 p-1" />
                </div>
              )}
            <div className="flex justify-center p-4 bg-white rounded-sm">
              <img alt="QR" src={qrPreviewUrl} className="max-w-full" />
            </div>
              <div className="mt-4 text-xs font-mono text-center text-cyan-400/80">{qrTokenId} • {qrSerial}</div>
              <div className="mt-6 flex items-center justify-center gap-4">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-medium">Tamaño PNG</label>
                <select className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 p-2 outline-none" value={qrPngSize} onChange={(e) => setQrPngSize(parseInt(e.target.value, 10) || 512)}>
                  <option value={256}>256px</option>
                  <option value={512}>512px</option>
                  <option value={1024}>1024px</option>
                </select>
                <input className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 p-2 w-20 text-center outline-none" type="number" min={128} max={2048} value={qrPngSize} onChange={(e) => {
                  const v = parseInt(e.target.value || '512', 10) || 512;
                  setQrPngSize(Math.max(128, Math.min(v, 2048)));
                }} />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <a className="px-4 py-2 text-xs uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800 text-center flex items-center justify-center" href={qrPreviewUrl} target="_blank" rel="noreferrer">Abrir</a>
                <button className="px-4 py-2 text-xs uppercase tracking-wider font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" disabled={demo} onClick={async () => {
                  const base = import.meta.env.VITE_API_URL;
                  const svg = `${base}/api/verification/qr/generate/${encodeURIComponent(qrIssuerId)}/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}?format=svg`;
                  try {
                    const blob = await issuanceService.fetchBlob(svg);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qr-${qrTokenId}-${qrSerial}.svg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {}
                }}>Descargar SVG</button>
                <button className="px-4 py-2 text-xs uppercase tracking-wider font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" disabled={demo} onClick={async () => {
                  const base = import.meta.env.VITE_API_URL;
                  const png = `${base}/api/verification/qr/generate/${encodeURIComponent(qrIssuerId)}/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}?format=png&width=${encodeURIComponent(qrPngSize)}`;
                  try {
                    const blob = await issuanceService.fetchBlob(png);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qr-${qrTokenId}-${qrSerial}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {}
                }}>Descargar PNG</button>
                <button className="px-4 py-2 text-xs uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrPreviewUrl);
                    setQrCopyMsg('Link de QR copiado');
                    setTimeout(() => setQrCopyMsg(''), 1500);
                  } catch {}
                }}>Copiar Link QR</button>
                <button className="col-span-2 px-4 py-2 text-xs uppercase tracking-wider font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-sm transition-colors border border-slate-800" onClick={async () => {
                  const base = import.meta.env.VITE_API_URL;
                  const verifyLink = `${base}/api/verification/verify/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}`;
                  const text = `QR: ${qrPreviewUrl}\nVerificación: ${verifyLink}`;
                  try {
                    await navigator.clipboard.writeText(text);
                    setQrCopyMsg('Enlaces QR y verificación copiados');
                    setTimeout(() => setQrCopyMsg(''), 1500);
                  } catch {}
                }}>Copiar Ambos Enlaces</button>

                {(() => {
                  const base = import.meta.env.VITE_API_URL;
                  const link = `${base}/api/verification/verify/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}`;
                  return (
                    <div className="flex items-center gap-2">
                      <a className="btn-primary" href={link} target="_blank" rel="noreferrer">Verificar</a>
                      <button className="btn-secondary" onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(link);
                          setQrCopyMsg('Link de verificación copiado');
                          setTimeout(() => setQrCopyMsg(''), 1500);
                        } catch {}
                      }}>Copiar Link Verificación</button>
                    </div>
                  );
                })()}
              </div>
                {qrCopyMsg && (<div className="mt-4 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-sm text-center">{qrCopyMsg}</div>)}
              <div className="mt-6 border-t border-slate-800 pt-4 text-xs font-mono text-slate-400">
                {qrMetaLoading ? (
                  <div className="text-center animate-pulse text-cyan-400">Cargando metadatos...</div>
                ) : qrMeta ? (
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500 uppercase tracking-wider text-[10px]">Universidad</span> <span className="text-right">{qrMeta.metadata?.attributes?.find(a => a.trait_type === 'University')?.value || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 uppercase tracking-wider text-[10px]">Programa</span> <span className="text-right">{qrMeta.metadata?.attributes?.find(a => a.trait_type === 'Degree')?.value || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 uppercase tracking-wider text-[10px]">Fecha</span> <span className="text-right">{qrMeta.metadata?.attributes?.find(a => a.display_type === 'date')?.value || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 uppercase tracking-wider text-[10px]">Ref</span> <span className="text-right">{qrMeta.metadata?.attributes?.find(a => a.trait_type === 'SubjectRef')?.value || 'N/A'}</span></div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Transacción</span>
                      {qrTxId ? (
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-sm border border-slate-800">
                          <a className="text-cyan-400 hover:text-cyan-300 truncate max-w-[200px]" href={`https://hashscan.io/mainnet/transaction/${encodeURIComponent(qrTxId)}`} target="_blank" rel="noreferrer">{qrTxId}</a>
                          <button className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-cyan-400" onClick={async () => { try { await navigator.clipboard.writeText(qrTxId); setQrCopyMsg('TransactionId copiado'); setTimeout(() => setQrCopyMsg(''), 1500); } catch {} }}>Copiar</button>
                        </div>
                      ) : 'N/A'}
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">IPFS</span>
                      {qrIpfsURI ? (
                        <a className="text-cyan-400 hover:text-cyan-300 bg-slate-950 p-2 rounded-sm border border-slate-800 truncate block" href={toGateway(qrIpfsURI)} target="_blank" rel="noreferrer">{toGateway(qrIpfsURI)}</a>
                      ) : 'N/A'}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
        {revokeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <div className="absolute inset-0" onClick={() => setRevokeModalOpen(false)} />
            <div className="relative bg-slate-900 border border-slate-800 rounded-sm shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-slate-200 tracking-wide uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Revocar Credencial
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-mono leading-relaxed">
                Estás a punto de revocar la credencial <strong className="text-slate-200">{selectedCredential?.tokenId}</strong> (Serial <span className="text-cyan-400">#{selectedCredential?.serialNumber}</span>).
                <br/><br/>
                <span className="text-red-400/80 text-xs uppercase tracking-wider border border-red-900/30 bg-red-900/10 px-2 py-1 rounded-sm">Acción Irreversible</span>
              </p>
              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2 block">Razón de revocación</label>
                <select className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-sm focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 w-full p-2.5 outline-none" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}>
                  <option value="">Selecciona una razón...</option>
                  <option value="PrivilegeWithdrawn">Privilegio Retirado (Expulsión/Suspensión)</option>
                  <option value="CessationOfOperation">Cese de Operaciones</option>
                  <option value="AffiliationChanged">Cambio de Afiliación</option>
                  <option value="Superseded">Reemplazada por nueva versión</option>
                  <option value="Compromised">Llave comprometida / Fraude</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button className="px-4 py-2 text-xs uppercase tracking-wider font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-sm transition-colors" onClick={() => setRevokeModalOpen(false)} disabled={revoking}>Cancelar</button>
                <button className="px-4 py-2 text-xs uppercase tracking-wider font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-sm transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed" onClick={confirmRevocation} disabled={!revokeReason || revoking}>
                  {revoking ? 'Revocando...' : 'Confirmar Revocación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstitutionDashboard;

