import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { verificationService } from '../services/verificationService';
 
const RevocationHistory = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [enriching, setEnriching] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verificationService.listRevocations({ tokenId: tokenId || undefined, limit, offset, startDate: startDate || undefined, endDate: endDate || undefined, reason: reason || undefined });
      const items = res?.data?.items || res?.items || [];
      const base = items.map(it => ({
        tokenId: it.tokenId,
        serialNumber: it.serialNumber,
        status: it.status,
        reason: it.revocationReason || '',
        revokedAt: it.revokedAt ? new Date(it.revokedAt) : null,
        hedera: it.hedera || {},
        student: '',
        university: ''
      }));
      setRows(base);
      setEnriching(true);
      try {
        const batch = [...base];
        const concurrency = 3;
        let idx = 0;
        const next = async () => {
          if (idx >= batch.length) return;
          const current = idx++;
          const item = batch[current];
          try {
            const verify = await verificationService.verifyCredential(item.tokenId, item.serialNumber);
            const cred = verify?.data?.credential;
            const attrs = Array.isArray(cred?.metadata?.attributes) ? cred.metadata.attributes : [];
            const stu = (attrs.find(a => a.trait_type === 'Student')?.value || '');
            const uni = (attrs.find(a => a.trait_type === 'University')?.value || '');
            setRows(prev => prev.map(r => (r.tokenId === item.tokenId && r.serialNumber === item.serialNumber ? { ...r, student: stu, university: uni } : r)));
          } catch {}
          await next();
        };
        const tasks = Array.from({ length: concurrency }).map(() => next());
        await Promise.all(tasks);
      } catch {}
    } finally {
      setEnriching(false);
      setLoading(false);
    }
  }, [tokenId, limit, offset, startDate, endDate, reason]);

  useEffect(() => { load(); }, [load]);

  const hasActiveFilters = useMemo(() => {
    return Boolean((startDate && startDate.length) || (endDate && endDate.length) || (reason && reason.length) || (tokenId && tokenId.length) || (query && query.length));
  }, [startDate, endDate, reason, tokenId, query]);
  const badgeClasses = useMemo(() => {
    switch (reason) {
      case 'Fraude detectado':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Error administrativo':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Sanción académica':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Anulación general':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, [reason]);
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setReason('');
    setTokenId('');
    setQuery('');
    setOffset(0);
  };

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      String(r.student || '').toLowerCase().includes(q) ||
      String(r.university || '').toLowerCase().includes(q) ||
      String(r.tokenId || '').toLowerCase().includes(q)
    );
  }, [rows, query]);
 
  const exportToCSV = () => {
    if (!filtered.length) {
      toast.error('No hay registros en la tabla para generar el reporte.');
      return;
    }
    const headers = ['Token ID', 'Serial', 'Estado', 'Motivo', 'Revocado', 'Alumno', 'Institución', 'Tx Hedera', 'Topic', 'Seq'];
    const lines = filtered.map(r => [
      r.tokenId,
      r.serialNumber,
      r.status,
      r.reason,
      r.revokedAt ? r.revokedAt.toISOString() : '',
      r.student,
      r.university,
      r.hedera?.transactionId || '',
      r.hedera?.topicId || '',
      r.hedera?.sequence ?? ''
    ].map(v => String(v ?? '').replace(/[\r\n]+/g, ' ')).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revocations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
 
  return (
    <div className="mt-6 bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl font-bold text-gray-800">Historial de Revocaciones</h3>
        <span className={`${badgeClasses} px-2.5 py-0.5 rounded-full text-sm font-bold shadow-sm border`}>
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          placeholder="Buscar (Alumno, Institución, Token ID)"
          className="input-primary flex-1 min-w-[240px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          placeholder="Token ID"
          className="input-primary w-48"
          value={tokenId}
          onChange={(e) => { setTokenId(e.target.value); setOffset(0); }}
        />
        <input
          type="date"
          className="input-primary w-44"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
        />
        <input
          type="date"
          className="input-primary w-44"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (startDate && v && v < startDate) {
              setEndDate('');
            } else {
              setEndDate(v);
            }
            setOffset(0);
          }}
        />
        <select
          className="input-primary w-56"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setOffset(0); }}
        >
          <option value="">Motivo (todos)</option>
          <option value="Error administrativo">Error administrativo</option>
          <option value="Fraude detectado">Fraude detectado</option>
          <option value="Sanción académica">Sanción académica</option>
          <option value="Anulación general">Anulación general</option>
        </select>
        <select className="input-primary w-24" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10) || 50)}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <button onClick={() => setOffset(Math.max(0, offset - limit))} className="btn-secondary">Anterior</button>
        <button onClick={() => setOffset(offset + limit)} className="btn-secondary">Siguiente</button>
        <button onClick={clearFilters} className={hasActiveFilters ? 'btn-primary' : 'btn-secondary'}>Limpiar</button>
        <button
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
            filtered.length === 0
              ? 'bg-gray-300 cursor-not-allowed opacity-50 text-gray-500'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
          }`}
        >
          {filtered.length === 0 ? '🚫 Sin datos para exportar' : `📊 Exportar CSV (${filtered.length})`}
        </button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left">Token</th>
              <th className="px-3 py-2 text-left">Serial</th>
              <th className="px-3 py-2 text-left">Alumno</th>
              <th className="px-3 py-2 text-left">Institución</th>
              <th className="px-3 py-2 text-left">Motivo</th>
              <th className="px-3 py-2 text-left">Revocado</th>
              <th className="px-3 py-2 text-left">Hedera</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const network = (import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet'));
              const explorer = r.hedera?.transactionId ? `https://hashscan.io/${network}/transaction/${r.hedera.transactionId}` : '';
              return (
                <tr key={`${r.tokenId}-${r.serialNumber}`} className="border-b">
                  <td className="px-3 py-2 font-mono">{r.tokenId}</td>
                  <td className="px-3 py-2 font-mono">{r.serialNumber}</td>
                  <td className="px-3 py-2">{r.student || (enriching ? '...' : '')}</td>
                  <td className="px-3 py-2">{r.university || (enriching ? '...' : '')}</td>
                  <td className="px-3 py-2">{r.reason || ''}</td>
                  <td className="px-3 py-2">{r.revokedAt ? r.revokedAt.toLocaleString() : ''}</td>
                  <td className="px-3 py-2 font-mono text-xs">{(r.hedera?.transactionId || '').slice(0, 18)}...</td>
                  <td className="px-3 py-2">
                    {explorer ? <a className="text-blue-600 underline text-sm" href={explorer} target="_blank" rel="noreferrer">Ver en Hashscan</a> : <span className="text-gray-500 text-xs">N/A</span>}
                  </td>
                </tr>
              );
            })}
            {(!loading && filtered.length === 0) && (
              <tr><td className="px-3 py-4 text-gray-500" colSpan={8}>Sin revocaciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {loading && <div className="mt-3 text-sm text-gray-600">Cargando...</div>}
    </div>
  );
};
 
export default RevocationHistory;
