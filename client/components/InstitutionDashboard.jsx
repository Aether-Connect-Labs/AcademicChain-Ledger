import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import IssueTitleForm from './IssueTitleForm';
import BatchIssuance from './BatchIssuance';

function InstitutionDashboard() {
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

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
  }, []);

  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Dashboard de la Institución</h1>
      <p className="text-gray-600">Bienvenido al portal de la institución. Aquí podrás emitir títulos y subir archivos Excel.</p>
      <div className="mt-8">
        <IssueTitleForm />
      </div>
      <div className="mt-8">
        <BatchIssuance />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Diplomas y Certificados emitidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input value={filterTokenId} onChange={(e) => setFilterTokenId(e.target.value)} placeholder="Filtrar por Token ID" className="input-primary" />
          <input value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} placeholder="Filtrar por Cuenta Hedera" className="input-primary" />
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => {
              const params = {};
              if (filterTokenId) params.tokenId = filterTokenId;
              if (filterAccountId) params.accountId = filterAccountId;
              const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
            }}>Buscar</button>
            <a className="btn-secondary" target="_blank" rel="noreferrer" href={`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001')}/api/universities/credentials?${new URLSearchParams({ ...(filterTokenId ? { tokenId: filterTokenId } : {}), ...(filterAccountId ? { accountId: filterAccountId } : {}), format: 'csv' }).toString()}`}>Exportar CSV</a>
          </div>
        </div>
        {loadingCreds && <div className="badge-info badge">Cargando listado...</div>}
        {errorCreds && <div className="badge-error badge">{errorCreds}</div>}
        {!loadingCreds && credentials.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow-soft">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-sm">
                  <th className="px-4 py-2 text-left">Token</th>
                  <th className="px-4 py-2 text-left">Serial</th>
                  <th className="px-4 py-2 text-left">IPFS</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={`${c.tokenId}-${c.serialNumber}`} className="border-t text-sm">
                    <td className="px-4 py-2">{c.tokenId}</td>
                    <td className="px-4 py-2">{c.serialNumber}</td>
                    <td className="px-4 py-2"><a href={c.ipfsURI} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ver</a></td>
                    <td className="px-4 py-2 space-x-2">
                      <a className="btn-secondary btn-sm" href={`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001')}/api/qr/generate/${c.tokenId}/${c.serialNumber}?format=svg`} target="_blank" rel="noreferrer">QR</a>
                      <a className="btn-primary btn-sm" href={`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001')}/api/verification/credential-history/${c.tokenId}/${c.serialNumber}`} target="_blank" rel="noreferrer">Verificar</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-3 border-t" role="navigation" aria-label="Controles de paginación">
              <div className="flex items-center gap-2">
                <button aria-label="Primera página" aria-disabled={page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={page <= 1 || loadingCreds} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <button aria-label="Página anterior" aria-disabled={page <= 1 || loadingCreds} className="btn-secondary btn-sm" disabled={page <= 1 || loadingCreds} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <button aria-label="Página siguiente" aria-disabled={loadingCreds || !meta.hasMore} className="btn-primary btn-sm" disabled={loadingCreds || !meta.hasMore} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <button aria-label="Última página" aria-disabled={loadingCreds || page >= meta.pages} className="btn-secondary btn-sm" disabled={loadingCreds || page >= meta.pages} onClick={() => {
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <select aria-label="Límite por página" className="input-primary" value={limit} onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10) || 10;
                  setLimit(newLimit);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <select aria-label="Orden" className="input-primary ml-2" value={sort} onChange={(e) => {
                  const newSort = e.target.value;
                  setSort(newSort);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <select aria-label="Ordenar por" className="input-primary ml-2" value={sortBy} onChange={(e) => {
                  const newSortBy = e.target.value;
                  setSortBy(newSortBy);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <input aria-label="Ir a página" className="input-primary ml-2 w-24" type="number" min={1} max={meta.pages || 1} value={targetPage} onChange={(e) => setTargetPage(e.target.value)} placeholder="Ir a" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const tp = Number(targetPage);
                    if (!tp || tp < 1 || tp > (meta.pages || 1) || loadingCreds) return;
                    const params = {};
                    if (filterTokenId) params.tokenId = filterTokenId;
                    if (filterAccountId) params.accountId = filterAccountId;
                    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
                <button aria-label="Ir a página" aria-disabled={loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} className="btn-secondary ml-1" disabled={loadingCreds || !targetPage || Number(targetPage) < 1 || Number(targetPage) > (meta.pages || 1)} onClick={() => {
                  const tp = Number(targetPage);
                  const params = {};
                  if (filterTokenId) params.tokenId = filterTokenId;
                  if (filterAccountId) params.accountId = filterAccountId;
                  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
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
      </div>
    </div>
  );
}

export default InstitutionDashboard;