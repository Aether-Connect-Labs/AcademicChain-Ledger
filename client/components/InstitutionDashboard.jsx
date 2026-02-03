import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import DocumentViewer from './ui/DocumentViewer';
import { issuanceService } from './services/issuanceService';
import { verificationService } from './services/verificationService';
import { demoService } from './services/demoService';
import { toGateway } from './utils/ipfsUtils';
import { useAuth } from './useAuth.jsx';
import developerService from './services/developerService';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

function InstitutionDashboard({ demo = false }) {
  const { token } = useAuth() || { token: '' };
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [errorCreds, setErrorCreds] = useState('');
  const [filterTokenId, setFilterTokenId] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
  const [onPrem, setOnPrem] = useState(false);
  const [usage, setUsage] = useState({ hedera: 0, xrp: 0, algorand: 0 });
  const [labLoading, setLabLoading] = useState(false);
  const [labMessage, setLabMessage] = useState('');
  const [labError, setLabError] = useState('');
  const [securityHover, setSecurityHover] = useState(false);

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

  const loadApiKeys = async () => {
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
  };

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

  const loadRateLimit = async () => {
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
  };

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
  }, [token]);

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

  return (
    <div className="container-responsive pb-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Dashboard de la Institución</h1>
      <p className="text-gray-600">Bienvenido al portal de la institución. Aquí podrás emitir títulos y subir archivos Excel.</p>
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
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="font-semibold">Métricas</div>
          {loadingStats && <div className="badge badge-info mt-2">Cargando métricas...</div>}
          {errorStats && <div className="badge badge-error mt-2">{errorStats}</div>}
          {!loadingStats && !errorStats && (
            <div className="text-sm text-gray-700 break-words mt-2">
              {stats ? JSON.stringify(stats) : 'Sin datos'}
            </div>
          )}
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Conectividad & API</div>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs border border-green-200">API Endpoint: Activo (Global)</div>
          <div className="mt-3">
            <button className="btn-primary" disabled={apiGenerating} onClick={handleGenerateApiKey}>
              {apiGenerating ? 'Generando…' : 'Generar Nueva API Key'}
            </button>
          </div>
          {apiMessage && <div className="text-green-700 text-sm mt-2">{apiMessage}</div>}
          {apiKey && (
            <div className="mt-3 p-3 rounded-lg border bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">x-api-key</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm break-all">{apiKeyVisible ? apiKey : maskKey(apiKey)}</div>
                <button className="btn-secondary btn-sm" onClick={() => setApiKeyVisible(v => !v)}>
                  {apiKeyVisible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(apiKey)}>Copiar</button>
              </div>
              <div className="mt-2 text-xs text-gray-600">Guárdala de forma segura. Por motivos de seguridad, se oculta por defecto.</div>
            </div>
          )}
          <div className="mt-3 text-xs text-gray-600">
            Incluye límites automáticos según plan (PRO/ENTERPRISE). Solicita SLA para instalación On‑Prem.
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Rate Limit</div>
            {rateLoading ? (
              <div className="badge badge-info">Cargando...</div>
            ) : (
              <div>
                {rateError && <div className="badge badge-error mb-2">{rateError}</div>}
                <div className="text-sm text-gray-700">Plan: {rateLimit?.plan || 'N/A'}</div>
                <div className="text-sm text-gray-700 mt-1">{rateLimit?.used || 0}/{rateLimit?.limit || 0} solicitudes</div>
                <div className="w-full h-2 bg-gray-200 rounded mt-2">
                  <div className="h-2 bg-blue-600 rounded" style={{ width: `${pct}%` }} />
                </div>
                {rateLimit?.resetsAt && <div className="text-xs text-gray-500 mt-1">Resetea: {formatDate(rateLimit.resetsAt)}</div>}
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Historial de Claves</div>
            {apiKeysLoading ? (
              <div className="badge badge-info">Cargando...</div>
            ) : apiKeysError ? (
              <div className="badge badge-error">{apiKeysError}</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-sm text-gray-500">Aún no hay claves registradas</div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((k) => {
                  const masked = maskKey(k.apiKey || '');
                  const s = k.status || 'active';
                  const isActive = s === 'active';
                  const isRevoking = revokingKey === k.apiKey;
                  const isRotating = rotatingKey === k.apiKey;
                  return (
                    <div key={k.apiKey} className="flex items-center justify-between p-2 rounded border bg-white">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm break-all">{masked}</div>
                        <div className="text-xs text-gray-600 mt-1">{s} • Creada: {formatDate(k.createdAt)}{k.lastUsedAt ? ` • Último uso: ${formatDate(k.lastUsedAt)}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button className={`btn-secondary btn-sm ${!isActive ? 'opacity-60 pointer-events-none' : ''}`} onClick={() => handleRevokeApiKey(k.apiKey)} disabled={!isActive || isRevoking}>
                          {isRevoking ? 'Revocando...' : 'Revocar'}
                        </button>
                        <button className={`btn-primary btn-sm ${!isActive ? 'opacity-60 pointer-events-none' : ''}`} onClick={() => handleRotateApiKey(k.apiKey)} disabled={!isActive || isRotating}>
                          {isRotating ? 'Rotando...' : 'Rotar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Branding Institucional</div>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/png,image/svg+xml" onChange={async (e) => {
                const f = e.target.files?.[0] || null;
                if (!f) return;
                try {
                  const uri = await issuanceService.uploadToIPFS(f);
                  setInstitutionalLogoUrl(toGateway(uri));
                } catch {}
              }} />
              {institutionalLogoUrl && <img src={institutionalLogoUrl} alt="Logo" className="h-8 w-8 rounded" />}
            </div>
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">On‑Prem & SLA</div>
            <div className="flex items-center justify-between p-3 rounded border bg-gray-50">
              <div>
                <div className="text-sm font-medium">Instalación Local</div>
                <div className="text-xs text-gray-600">Disponible en Enterprise. Solicita acceso.</div>
              </div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={onPrem} onChange={() => {}} disabled />
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Bloqueado</span>
              </label>
            </div>
            <div className="mt-2">
              <a className="btn-secondary btn-sm" href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank" rel="noreferrer">Descargar SLA</a>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Analíticas por Red</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded border bg-white">
                <div className="text-xs text-gray-600">Hedera</div>
                <div className="text-xl font-bold">{usage.hedera || 0}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="text-xs text-gray-600">XRP</div>
                <div className="text-xl font-bold">{usage.xrp || 0}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="text-xs text-gray-600">Algorand</div>
                <div className="text-xl font-bold">{usage.algorand || 0}</div>
              </div>
            </div>
            <div className="mt-3 card">
              {(() => {
                const labels = ['Hedera', 'XRP', 'Algorand'];
                const values = [usage.hedera || 0, usage.xrp || 0, usage.algorand || 0];
                const target = Math.max(...values, 1);
                const gradientFactory = (ctx) => {
                  const g = ctx.createLinearGradient(0, 0, 0, 200);
                  g.addColorStop(0, 'rgba(6,182,212,0.7)');
                  g.addColorStop(1, 'rgba(168,85,247,0.7)');
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
                      borderColor: 'rgba(99,102,241,0.5)',
                      borderWidth: 1,
                      borderRadius: 8
                    },
                    {
                      type: 'line',
                      label: 'Nivel óptimo',
                      data: [target, target, target],
                      borderColor: 'rgba(34,197,94,0.9)',
                      pointBackgroundColor: 'rgba(34,197,94,0.9)',
                      tension: 0.3
                    }
                  ]
                };
                const options = {
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 1000 },
                  plugins: { legend: { display: true }, tooltip: { enabled: true } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                  }
                };
                const usedNetworks = ['hedera','xrp','algorand'].filter(n => (values[['Hedera','XRP','Algorand'].indexOf(n)] || 0) > 0).length;
                const securityPct = usedNetworks === 0 ? 0 : Math.round((usedNetworks / 3) * 100);
                const levelLabel = usedNetworks >= 3 ? 'Blindaje Total' : (usedNetworks === 2 ? 'Seguridad Avanzada' : (usedNetworks === 1 ? 'Seguridad Base' : 'Sin uso'));
                const doughnutData = {
                  labels: ['Nivel de Seguridad', ''],
                  datasets: [{ data: [securityPct, 100 - securityPct], backgroundColor: ['rgba(34,197,94,0.9)', 'rgba(203,213,225,0.5)'], borderWidth: 0 }]
                };
                const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } }, animation: { duration: 1000 } };
                const tooltipMsg = securityPct >= 100
                  ? 'Máximo Estándar Global. Triple redundancia inmutable (H + X + A). Protección contra fallos críticos y auditoría internacional inmediata. Recomendado: Enterprise'
                  : (securityPct >= 66
                    ? 'Doble Consenso Distribuido (Hedera + XRP). Alta resiliencia y verificación dual. Recomendado: Enterprise'
                    : (securityPct >= 33
                      ? 'Certificación inmutable en red Hedera Hashgraph. Resistencia estándar contra fraude y manipulación de datos.'
                      : 'Sin blindaje activo. Activa tu API y emite para ver tu nivel de seguridad.'));
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 h-64 bg-white/80 backdrop-blur-md border border-white/20 rounded-xl p-3">
                      <Bar data={data} options={options} />
                    </div>
                    <div className="h-64 bg-white/80 backdrop-blur-md border border-white/20 rounded-xl p-3 flex flex-col items-center justify-center">
                      <div className="w-36 h-36 relative" onMouseEnter={() => setSecurityHover(true)} onMouseLeave={() => setSecurityHover(false)}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{securityPct}%</div>
                            <div className="text-xs text-gray-600 mt-1">{levelLabel}</div>
                          </div>
                        </div>
                        {securityHover && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full max-w-xs bg-black/70 text-white text-xs p-3 rounded-lg shadow-strong border border-white/20">
                            {tooltipMsg}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-sm text-gray-700">Nivel de Seguridad</div>
                      <button className="btn-secondary btn-sm mt-2" onClick={async () => {
                        try {
                          const doc = new jsPDF();
                          if (institutionalLogoUrl) {
                            try {
                              const r = await fetch(institutionalLogoUrl);
                              const b = await r.blob();
                              const reader = new FileReader();
                              await new Promise((res, rej) => { reader.onload = () => res(); reader.onerror = rej; reader.readAsDataURL(b); });
                              doc.addImage(reader.result, 'PNG', 10, 10, 20, 20);
                            } catch {}
                          }
                          doc.setFontSize(16);
                          doc.text('ACADEMIC CHAIN LEDGER: PROPUESTA ENTERPRISE', 10, institutionalLogoUrl ? 40 : 20);
                          doc.setFontSize(12);
                          doc.text('Solución: Infraestructura de Triple Blindaje Blockchain (Hedera + XRP + Algorand)', 10, institutionalLogoUrl ? 55 : 35);
                          doc.text('Costo Mensual: A medida (Volumen corporativo)', 10, institutionalLogoUrl ? 65 : 45);
                          doc.text('Costo Unitario: $0.80 USD', 10, institutionalLogoUrl ? 75 : 55);
                          doc.text('Garantía: SLA de 99.9% y soporte VIP 24/7', 10, institutionalLogoUrl ? 85 : 65);
                          doc.text('Implementación: API Key inmediata o On‑Premise', 10, institutionalLogoUrl ? 95 : 75);
                          doc.text('Beneficio: Auditoría internacional y resiliencia por triple consenso distribuido', 10, institutionalLogoUrl ? 105 : 85);
                          doc.save('Propuesta-ACL-Enterprise.pdf');
                        } catch {}
                      }}>Descargar Propuesta Comercial PDF</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">ACL Labs: Test de Emisión</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button className="btn-secondary" disabled={labLoading || !apiKey} onClick={async () => {
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
              }}>Emitir Standard (H)</button>
              <button className="btn-secondary" disabled={labLoading || !apiKey} onClick={async () => {
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
              }}>Emitir Dual (H+X)</button>
              <button className="btn-primary" disabled={labLoading || !apiKey} onClick={async () => {
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
              }}>Emitir Triple (H+X+A)</button>
            </div>
            {labLoading && <div className="badge badge-info mt-2">Procesando...</div>}
            {labMessage && <div className="badge badge-success mt-2">{labMessage}</div>}
            {labError && <div className="badge badge-error mt-2">{labError}</div>}
            {!apiKey && <div className="text-xs text-gray-600 mt-2">Genera una API Key para habilitar las pruebas.</div>}
          </div>
        </div>
        <div className="card">
          <div className="font-semibold">Total Credenciales</div>
          <div className="text-2xl mt-2">{meta.total || 0}</div>
        </div>
        <div className="card">
          <div className="font-semibold">Página Actual</div>
          <div className="text-2xl mt-2">{page}</div>
        </div>
      </div>
      <div className="mt-8">
        <div className="card">
          <div className="font-semibold mb-3">Crear Token Académico (HTS)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-primary" placeholder="Nombre del Token" value={tokenName} onChange={(e) => setTokenName(e.target.value)} disabled={creatingToken || demo} />
            <input className="input-primary" placeholder="Símbolo (p.ej. ACAD)" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} disabled={creatingToken || demo} />
            <input className="input-primary" placeholder="Memo (opcional)" value={tokenMemo} onChange={(e) => setTokenMemo(e.target.value)} disabled={creatingToken || demo} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="btn-primary btn-lg" disabled={creatingToken || demo || !tokenName || !tokenSymbol} onClick={handleCreateToken}>
              {creatingToken ? 'Creando...' : 'Crear Token HTS'}
            </button>
            {tokenMessage && <div className="badge badge-success">{tokenMessage}</div>}
            {tokenError && <div className="badge badge-error">{tokenError}</div>}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="card">
          <div className="font-semibold mb-3">Verificar Credencial (Hedera + XRP)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-primary" placeholder="Token ID (p.ej. 0.0.x)" value={verifyTokenId} onChange={(e) => setVerifyTokenId(e.target.value)} />
            <input className="input-primary" placeholder="Serial Number" value={verifySerial} onChange={(e) => setVerifySerial(e.target.value)} />
            <button className="btn-primary btn-lg" onClick={handleOpenVerification} disabled={!verifyTokenId || !verifySerial}>Abrir Verificación</button>
          </div>
          <div className="text-xs text-gray-500 mt-2">Se abrirá una página con el estado en Hedera y el anclaje XRP.</div>
        </div>
      </div>
      <div className="mt-8">
        <IssueTitleForm demo={demo} />
      </div>
      <div className="mt-8">
        <BatchIssuance demo={demo} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Diplomas y Certificados emitidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input value={filterTokenId} onChange={(e) => setFilterTokenId(e.target.value)} placeholder="Filtrar por Token ID" className="input-primary" disabled={demo} />
          <input value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} placeholder="Filtrar por Cuenta Hedera" className="input-primary" disabled={demo} />
          <div className="flex items-center gap-2">
            <button className="btn-primary" disabled={demo} onClick={() => {
              loadCredentials({
                page: 1,
                tokenId: filterTokenId || undefined,
                accountId: filterAccountId || undefined
              });
            }}>
              Buscar
            </button>
            <a className={`btn-secondary ${demo ? 'pointer-events-none opacity-60' : ''}`} target="_blank" rel="noreferrer" href={`${import.meta.env.VITE_API_URL}/api/universities/credentials?${new URLSearchParams({ ...(filterTokenId ? { tokenId: filterTokenId } : {}), ...(filterAccountId ? { accountId: filterAccountId } : {}), format: 'csv' }).toString()}`}>Exportar CSV</a>
          </div>
        </div>
        {loadingCreds && <div className="badge-info badge">Cargando listado...</div>}
        {errorCreds && <div className="badge-error badge">{errorCreds}</div>}
        {!loadingCreds && credentials.length > 0 && (
          <div>
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-soft">
              <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-sm">
                  <th className="px-4 py-2 text-left">Token</th>
                  <th className="px-4 py-2 text-left">Serial</th>
                  <th className="px-4 py-2 text-left">IPFS</th>
                  <th className="px-4 py-2 text-left">XRP Tx</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={`${c.tokenId}-${c.serialNumber}`} className="border-t text-sm">
                    <td className="px-4 py-2">{c.tokenId}</td>
                    <td className="px-4 py-2">{c.serialNumber}</td>
                    <td className="px-4 py-2"><button className="btn-secondary btn-sm" onClick={() => { setDocUrl(toGateway(c.ipfsURI)); setDocOpen(true); }}>Ver</button></td>
                    <td className="px-4 py-2">{c.xrpAnchor?.xrpTxHash ? <a href={`https://testnet.xrplexplorer.com/tx/${c.xrpAnchor.xrpTxHash}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{c.xrpAnchor.xrpTxHash.slice(0, 8)}...</a> : 'N/A'}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button className="btn-secondary btn-sm" disabled={demo} onClick={() => {
                        const base = import.meta.env.VITE_API_URL;
                        const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=svg`;
                        setQrPreviewUrl(u);
                        setQrTokenId(c.tokenId);
                        setQrSerial(String(c.serialNumber));
                        setQrIssuerId(String(c.universityId || ''));
                        setQrIpfsURI(c.ipfsURI || '');
                        setQrPreviewOpen(true);
                      }}>QR (SVG)</button>
                      <button className="btn-secondary btn-sm" disabled={demo} onClick={() => {
                        const base = import.meta.env.VITE_API_URL;
                        const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=png&width=${qrPngSize}`;
                        setQrPreviewUrl(u);
                        setQrTokenId(c.tokenId);
                        setQrSerial(String(c.serialNumber));
                        setQrIssuerId(String(c.universityId || ''));
                        setQrIpfsURI(c.ipfsURI || '');
                        setQrPreviewOpen(true);
                      }}>QR (PNG)</button>
                      <a className="btn-primary btn-sm" href={`${import.meta.env.VITE_API_URL}/api/verification/credential-history/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Verificar</a>
                      <a className="btn-primary btn-sm" href={`${import.meta.env.VITE_API_URL}/api/verification/verify/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Dual (Hedera+XRP)</a>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {credentials.map((c) => (
                <div key={`${c.tokenId}-${c.serialNumber}`} className="credential-card">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm max-w-[60%] overflow-wrap">{c.tokenId}</div>
                    <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">#{c.serialNumber}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 break-all">
                    {c.xrpAnchor?.xrpTxHash ? (
                      <a href={`https://testnet.xrplexplorer.com/tx/${c.xrpAnchor.xrpTxHash}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">XRPL {c.xrpAnchor.xrpTxHash.slice(0, 8)}...</a>
                    ) : (
                      <span>XRPL N/A</span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="btn-secondary btn-sm" onClick={() => { setDocUrl(toGateway(c.ipfsURI)); setDocOpen(true); }}>Ver Documento</button>
                    <button className="btn-secondary btn-sm" disabled={demo} onClick={() => {
                      const base = import.meta.env.VITE_API_URL || '';
                      const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=png&width=${qrPngSize}`;
                      setQrPreviewUrl(u);
                      setQrTokenId(c.tokenId);
                      setQrSerial(String(c.serialNumber));
                      setQrIssuerId(String(c.universityId || ''));
                      setQrIpfsURI(c.ipfsURI || '');
                      setQrPreviewOpen(true);
                    }}>QR</button>
                    <a className="btn-primary btn-sm" href={`${(import.meta.env.VITE_API_URL || '')}/api/verification/credential-history/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Verificar</a>
                    <a className="btn-primary btn-sm" href={`${(import.meta.env.VITE_API_URL || '')}/api/verification/verify/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Dual</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 border-t" role="navigation" aria-label="Controles de paginación">
              <div className="flex items-center gap-2">
                <button aria-label="Primera página" aria-disabled={demo || page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  loadCredentials({ page: 1 });
                }}>Primera</button>
                <button aria-label="Página anterior" aria-disabled={demo || page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  loadCredentials({ page: page - 1 });
                }}>Anterior</button>
                <button aria-label="Página siguiente" aria-disabled={demo || loadingCreds || !meta.hasMore} className="btn-primary btn-sm" disabled={demo || loadingCreds || !meta.hasMore} onClick={() => {
                  loadCredentials({ page: page + 1 });
                }}>Siguiente</button>
                <button aria-label="Última página" aria-disabled={demo || loadingCreds || page >= meta.pages} className="btn-secondary btn-sm" disabled={demo || loadingCreds || page >= meta.pages} onClick={() => {
                  loadCredentials({ page: meta.pages });
                }}>Última</button>
              </div>
              <div className="text-sm text-gray-600" role="status" aria-live="polite">Mostrando {meta.from}-{meta.to} de {meta.total} • Página {page} de {meta.pages}</div>
              <div>
                <select aria-label="Límite por página" className="input-primary" value={limit} disabled={demo} onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10) || 10;
                  loadCredentials({ page: 1, limit: newLimit });
                }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <select aria-label="Orden" className="input-primary ml-2" value={sort} disabled={demo} onChange={(e) => {
                  const newSort = e.target.value;
                  loadCredentials({ page: 1, sort: newSort });
                }}>
                  <option value="desc">Nuevos primero</option>
                  <option value="asc">Antiguos primero</option>
                </select>
                <select aria-label="Ordenar por" className="input-primary ml-2" value={sortBy} disabled={demo} onChange={(e) => {
                  const newSortBy = e.target.value;
                  loadCredentials({ page: 1, sortBy: newSortBy });
                }}>
                  <option value="createdAt">Fecha</option>
                  <option value="tokenId">Token ID</option>
                  <option value="serialNumber">Serial</option>
                  <option value="uniqueHash">Hash</option>
                  <option value="studentAccountId">Cuenta Hedera</option>
                </select>
                <input aria-label="Ir a página" className="input-primary ml-2 w-24" type="number" min={1} max={meta.pages || 1} value={targetPage} disabled={demo} onChange={(e) => setTargetPage(e.target.value)} placeholder="Ir a" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const tp = Number(targetPage);
                    if (!tp || tp < 1 || tp > (meta.pages || 1) || loadingCreds) return;
                    loadCredentials({ page: tp });
                  }
                }} />
                <button aria-label="Ir a página" aria-disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} className="btn-secondary ml-1" disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} onClick={() => {
                  const tp = Number(targetPage);
                  loadCredentials({ page: tp });
                }}>Ir</button>
              </div>
            </div>
          </div>
        )}
        {!loadingCreds && credentials.length === 0 && (
          <div className="badge badge-info">Aún no hay credenciales emitidas</div>
        )}
        <DocumentViewer open={docOpen} src={docUrl} title="Documento" onClose={() => setDocOpen(false)} />
        {qrPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setQrPreviewOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-strong w-full max-w-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold">Código QR</div>
                <button className="btn-ghost" onClick={() => setQrPreviewOpen(false)}>✕</button>
              </div>
              {institutionalLogoUrl && (
                <div className="flex justify-center mb-2">
                  <img alt="Logo Institucional" src={institutionalLogoUrl} className="h-10 w-10 rounded" />
                </div>
              )}
            <div className="flex justify-center">
              <img alt="QR" src={qrPreviewUrl} className="max-w-full" />
            </div>
              <div className="mt-4 text-xs text-gray-600">{qrTokenId} • {qrSerial}</div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm text-gray-700">Tamaño PNG</label>
                <select className="input-primary" value={qrPngSize} onChange={(e) => setQrPngSize(parseInt(e.target.value, 10) || 512)}>
                  <option value={256}>256</option>
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                </select>
                <input className="input-primary w-24" type="number" min={128} max={2048} value={qrPngSize} onChange={(e) => {
                  const v = parseInt(e.target.value || '512', 10) || 512;
                  setQrPngSize(Math.max(128, Math.min(v, 2048)));
                }} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <a className="btn-secondary" href={qrPreviewUrl} target="_blank" rel="noreferrer">Abrir en pestaña</a>
                <button className="btn-primary" disabled={demo} onClick={async () => {
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
                <button className="btn-primary" disabled={demo} onClick={async () => {
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
                <button className="btn-secondary" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrPreviewUrl);
                    setQrCopyMsg('Link de QR copiado');
                    setTimeout(() => setQrCopyMsg(''), 1500);
                  } catch {}
                }}>Copiar enlace QR</button>
                <button className="btn-secondary" onClick={async () => {
                  const base = import.meta.env.VITE_API_URL;
                  const verifyLink = `${base}/api/verification/verify/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}`;
                  const text = `QR: ${qrPreviewUrl}\nVerificación: ${verifyLink}`;
                  try {
                    await navigator.clipboard.writeText(text);
                    setQrCopyMsg('Enlaces QR y verificación copiados');
                    setTimeout(() => setQrCopyMsg(''), 1500);
                  } catch {}
                }}>Copiar ambos enlaces</button>
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
                      }}>Copiar enlace verificación</button>
                    </div>
                  );
                })()}
              </div>
                {qrCopyMsg && (<div className="mt-2 text-xs text-green-700 bg-green-100 border border-green-300 px-3 py-2 rounded">{qrCopyMsg}</div>)}
              <div className="mt-3 text-sm text-gray-700">
                {qrMetaLoading ? (
                  <div className="badge badge-info">Cargando detalles...</div>
                ) : qrMeta ? (
                  <div className="space-y-1">
                    <div>Universidad: {(qrMeta.metadata?.attributes || []).find(a => a.trait_type === 'University')?.value || 'N/A'}</div>
                    <div>Programa: {(qrMeta.metadata?.attributes || []).find(a => a.trait_type === 'Degree')?.value || 'N/A'}</div>
                    <div>Fecha: {(qrMeta.metadata?.attributes || []).find(a => a.display_type === 'date')?.value || 'N/A'}</div>
                    <div>SubjectRef: {(qrMeta.metadata?.attributes || []).find(a => a.trait_type === 'SubjectRef')?.value || 'N/A'}</div>
                    <div>Transacción: {qrTxId ? (
                      <span className="inline-flex items-center gap-2">
                        <a className="text-blue-600 hover:underline" href={`https://hashscan.io/mainnet/transaction/${encodeURIComponent(qrTxId)}`} target="_blank" rel="noreferrer">{qrTxId}</a>
                        <button className="btn-ghost btn-xs" onClick={async () => { try { await navigator.clipboard.writeText(qrTxId); setQrCopyMsg('TransactionId copiado'); setTimeout(() => setQrCopyMsg(''), 1500); } catch {} }}>Copiar</button>
                      </span>
                    ) : 'N/A'}</div>
                    <div>IPFS: {qrIpfsURI ? (<a className="text-blue-600 hover:underline" href={toGateway(qrIpfsURI)} target="_blank" rel="noreferrer">{toGateway(qrIpfsURI)}</a>) : 'N/A'}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstitutionDashboard;
