import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';
import DocumentViewer from './ui/DocumentViewer';

function InstitutionDashboard({ demo = false }) {
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
  const toGateway = (uri) => {
    if (!uri) return '';
    const gw = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    if (uri.startsWith('ipfs://')) return gw + uri.replace('ipfs://','');
    return uri;
  };

  useEffect(() => {
    if (demo) {
      const sample = [
        { id: 'demo-1', tokenId: '0.0.123456', serialNumber: '1', title: 'Título Profesional', issuer: 'Demo University', ipfsURI: 'ipfs://demoCID1', createdAt: new Date().toISOString() },
        { id: 'demo-2', tokenId: '0.0.123456', serialNumber: '2', title: 'Certificado de Curso', issuer: 'Demo University', ipfsURI: 'ipfs://demoCID2', createdAt: new Date().toISOString() },
        { id: 'demo-3', tokenId: '0.0.987654', serialNumber: '1', title: 'Diploma de Posgrado', issuer: 'Demo Institute', ipfsURI: 'ipfs://demoCID3', createdAt: new Date().toISOString() }
      ];
      setCredentials(sample);
      setMeta({ total: sample.length, page: 1, limit: 10, pages: 1, hasMore: false, from: 1, to: sample.length });
      return;
    }
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
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
    const fetchCreds = async (params = {}) => {
      setLoadingCreds(true);
      setErrorCreds('');
      try {
        if (!API_BASE_URL) return;
        const q = new URLSearchParams({ page: initialPage, limit: initialLimit, sort: initialSort, sortBy: initialSortBy, tokenId: initialTokenId || undefined, accountId: initialAccountId || undefined, ...params }).toString();
        const url = q ? `${API_BASE_URL}/api/universities/credentials?${q}` : `${API_BASE_URL}/api/universities/credentials`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = data?.data?.credentials || [];
        const metaData = data?.data?.meta || { page: 1, limit: 10, total: list.length, pages: 1, hasMore: false };
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
    fetchCreds();
  }, [demo, searchParams]);

  const handleCreateToken = async () => {
    setCreatingToken(true);
    setTokenError('');
    setTokenMessage('');
    try {
      if (demo) {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE_URL}/api/demo/create-token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenName, tokenSymbol: tokenSymbol || undefined }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        const tid = data?.data?.tokenId || data?.data?.token?.tokenId || '';
        setTokenMessage(`Token demo creado: ${tid}`);
        setDemoTokenId(tid);
        setTokenName(''); setTokenSymbol(''); setTokenMemo('');
        return;
      }
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const jwt = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
      if (!API_BASE_URL || !jwt) throw new Error('API no disponible o sesión inválida');
      const res = await fetch(`${API_BASE_URL}/api/universities/create-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ tokenName, tokenSymbol, tokenMemo: tokenMemo || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
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
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const payload = {
        tokenId: demoTokenId || filterTokenId || tokenName || '0.0.0',
        uniqueHash: demoUniqueHash || Math.random().toString(36).slice(2),
        ipfsURI: demoIpfsURI,
        recipientAccountId: demoRecipientAccountId || undefined,
        degree: tokenMemo || undefined,
        studentName: undefined,
      };
      const res = await fetch(`${API_BASE_URL}/api/demo/issue-credential`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
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

  const handleOpenVerification = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    if (!verifyTokenId || !verifySerial) return;
    const url = `${API_BASE_URL}/api/verification/verify/${encodeURIComponent(verifyTokenId)}/${encodeURIComponent(verifySerial)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (demo) {
      setStats({ totalCredentials: 3, totalStudents: 2, issuedToday: 0 });
      return;
    }
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/universities/statistics`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
    const base = import.meta.env.VITE_API_URL;
    const url = `${base}/api/verification/credential-history/${encodeURIComponent(qrTokenId)}/${encodeURIComponent(qrSerial)}`;
    setQrMetaLoading(true);
    setQrMeta(null);
    fetch(url).then(async (res) => {
      const data = await res.json();
      setQrMeta(data?.data?.credential || null);
      try {
        const cred = data?.data?.credential || null;
        const attrs = cred?.metadata?.attributes || [];
        const txAttr = attrs.find(a => a.trait_type === 'TransactionId' || a.trait_type === 'TxId');
        const tx = data?.data?.transactionId || cred?.transactionId || cred?.metadata?.transactionId || txAttr?.value || '';
        setQrTxId(tx || '');
      } catch { setQrTxId(''); }
      setQrMetaLoading(false);
    }).catch(() => { setQrMetaLoading(false); });
  }, [qrPreviewOpen, qrTokenId, qrSerial]);

  return (
    <div className="container-responsive py-10">
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
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const res = await fetch(`${API_BASE_URL}/api/demo/pin-credential`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ degree: tokenMemo || 'Demo Degree', studentName: 'Demo Student', tokenId: demoTokenId || undefined, uniqueHash: demoUniqueHash || undefined })
                  });
                  const data = await res.json();
                  if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
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
                  const link = `${window.location.origin}/verificar?tokenId=${encodeURIComponent(item.tokenId)}&serialNumber=${encodeURIComponent(item.serialNumber)}`;
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
              const params = {};
              if (filterTokenId) params.tokenId = filterTokenId;
              if (filterAccountId) params.accountId = filterAccountId;
              const API_BASE_URL = import.meta.env.VITE_API_URL;
              const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const q = new URLSearchParams({ page: 1, limit, sort, sortBy, ...params }).toString();
              const url = q ? `${API_BASE_URL}/api/universities/credentials?${q}` : `${API_BASE_URL}/api/universities/credentials`;
              setSearchParams({ ...params, page: '1', limit: String(limit), sort, sortBy });
              setLoadingCreds(true);
              fetch(url, { headers }).then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setCredentials(data?.data?.credentials || []);
                const metaData = data?.data?.meta || { page: 1, limit };
                setMeta(metaData);
                setPage(metaData.page);
                setLoadingCreds(false);
              }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
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
                    <div className="font-mono text-sm truncate max-w-[60%]">{c.tokenId}</div>
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
                      const base = import.meta.env.VITE_API_URL;
                      const u = `${base}/api/verification/qr/generate/${c.universityId}/${c.tokenId}/${c.serialNumber}?format=png&width=${qrPngSize}`;
                      setQrPreviewUrl(u);
                      setQrTokenId(c.tokenId);
                      setQrSerial(String(c.serialNumber));
                      setQrIssuerId(String(c.universityId || ''));
                      setQrIpfsURI(c.ipfsURI || '');
                      setQrPreviewOpen(true);
                    }}>QR</button>
                    <a className="btn-primary btn-sm" href={`${import.meta.env.VITE_API_URL}/api/verification/credential-history/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Verificar</a>
                    <a className="btn-primary btn-sm" href={`${import.meta.env.VITE_API_URL}/api/verification/verify/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Dual</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 border-t" role="navigation" aria-label="Controles de paginación">
              <div className="flex items-center gap-2">
                <button aria-label="Primera página" aria-disabled={demo || page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: 1, limit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: '1', limit: String(limit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: 1, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>Primera</button>
                <button aria-label="Página anterior" aria-disabled={demo || page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={demo || page <= 1 || loadingCreds} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: page - 1, limit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: String(page - 1), limit: String(limit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: page - 1, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>Anterior</button>
                <button aria-label="Página siguiente" aria-disabled={demo || loadingCreds || !meta.hasMore} className="btn-primary btn-sm" disabled={demo || loadingCreds || !meta.hasMore} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: page + 1, limit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: String(page + 1), limit: String(limit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: page + 1, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>Siguiente</button>
                <button aria-label="Última página" aria-disabled={demo || loadingCreds || page >= meta.pages} className="btn-secondary btn-sm" disabled={demo || loadingCreds || page >= meta.pages} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: meta.pages, limit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: String(meta.pages), limit: String(limit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: meta.pages, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>Última</button>
              </div>
              <div className="text-sm text-gray-600" role="status" aria-live="polite">Mostrando {meta.from}-{meta.to} de {meta.total} • Página {page} de {meta.pages}</div>
              <div>
                <select aria-label="Límite por página" className="input-primary" value={limit} disabled={demo} onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10) || 10;
                  setLimit(newLimit);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: 1, limit: newLimit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: '1', limit: String(newLimit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: 1, limit: newLimit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <select aria-label="Orden" className="input-primary ml-2" value={sort} disabled={demo} onChange={(e) => {
                  const newSort = e.target.value;
                  setSort(newSort);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: 1, limit, sort: newSort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: '1', limit: String(limit), sort: newSort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: 1, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
                }}>
                  <option value="desc">Nuevos primero</option>
                  <option value="asc">Antiguos primero</option>
                </select>
                <select aria-label="Ordenar por" className="input-primary ml-2" value={sortBy} disabled={demo} onChange={(e) => {
                  const newSortBy = e.target.value;
                  setSortBy(newSortBy);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: 1, limit, sort, sortBy: newSortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: '1', limit: String(limit), sort, sortBy: newSortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: 1, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
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
                    const params = {};
                    if (filterTokenId) params.tokenId = filterTokenId;
                    if (filterAccountId) params.accountId = filterAccountId;
                    const API_BASE_URL = import.meta.env.VITE_API_URL;
                    const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const q = new URLSearchParams({ page: tp, limit, sort, sortBy, ...params }).toString();
                    const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                    setSearchParams({ ...params, page: String(tp), limit: String(limit), sort, sortBy });
                    setLoadingCreds(true);
                    fetch(url, { headers }).then(async (res) => {
                      const data = await res.json();
                      setCredentials(data?.data?.credentials || []);
                      const metaData = data?.data?.meta || { page: tp, limit };
                      setMeta(metaData);
                      setPage(metaData.page);
                      setLoadingCreds(false);
                    }).catch((err) => { setErrorCreds(err.message); setLoadingCreds(false); });
                  }
                }} />
                <button aria-label="Ir a página" aria-disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} className="btn-secondary ml-1" disabled={demo || loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} onClick={() => {
                  const tp = Number(targetPage);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL;
                  const token = (() => { try { return localStorage.getItem('authToken'); } catch { return null; } })();
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const q = new URLSearchParams({ page: tp, limit, sort, sortBy, ...params }).toString();
                  const url = `${API_BASE_URL}/api/universities/credentials?${q}`;
                  setSearchParams({ ...params, page: String(tp), limit: String(limit), sort, sortBy });
                  setLoadingCreds(true);
                  fetch(url, { headers }).then(async (res) => {
                    const data = await res.json();
                    setCredentials(data?.data?.credentials || []);
                    const metaData = data?.data?.meta || { page: tp, limit };
                    setMeta(metaData);
                    setPage(metaData.page);
                    setLoadingCreds(false);
                  }).catch((e) => { setErrorCreds(e.message); setLoadingCreds(false); });
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
                    const res = await fetch(svg);
                    const blob = await res.blob();
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
                    const res = await fetch(png);
                    const blob = await res.blob();
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
