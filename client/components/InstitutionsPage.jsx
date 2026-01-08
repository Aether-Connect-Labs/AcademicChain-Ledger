import React, { useEffect, useState } from 'react';
import institutionService from './services/institutionService';

const InstitutionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const demoItems = [
    { id: 'demo-1', name: 'Demo University', email: 'contact@demo.univ', tokens: 3, credentials: 128, since: new Date().toISOString() },
    { id: 'demo-2', name: 'Blockchain Institute', email: 'info@block.institute', tokens: 2, credentials: 64, since: new Date().toISOString() },
  ];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await institutionService.getCatalog();
      setItems(data?.data?.universities || []);
    } catch (e) {
      console.warn('Error loading catalog, using demo data', e);
      // If error is network related, show friendly message
      const msg = e.message || 'Error al cargar instituciones';
      const status = (e && e.response && e.response.status) || null;
      const is500 = status === 500 || /(^|[^0-9])500([^0-9]|$)/.test(msg);
      const friendly = is500
        ? 'Error interno del servidor (HTTP 500). Mostrando instituciones de demostración.'
        : /network|fetch|fail|http\s*\d+|5\d\d/i.test(msg)
          ? 'Servicio en mantenimiento. Mostrando instituciones de demostración.'
          : msg;
      
      setError(friendly);
      setItems(demoItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container-responsive pb-10 pt-24 sm:pt-32">
      <h1 className="text-4xl font-extrabold tracking-tight text-black mb-2">Instituciones</h1>
      <p className="text-gray-700">Directorio público de instituciones emisoras.</p>
      <div className="mt-4 flex gap-2">
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar'}</button>
      </div>
      {loading && <div className="badge badge-info mt-6">Cargando…</div>}
      {error && (
        <div className="mt-6 p-4 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900">
          <div className="font-semibold mb-1">Aviso</div>
          <div className="text-sm">{error}</div>
        </div>
      )}
      {!loading && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((u) => (
            <div key={u.id} className="card p-4">
              <div className="font-semibold text-lg">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
              <div className="mt-2 text-sm">Tokens: {u.tokens}</div>
              <div className="text-sm">Credenciales: {u.credentials}</div>
              <div className="text-xs text-gray-500">Desde: {u.since ? new Date(u.since).toLocaleDateString() : 'N/A'}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-600">No hay instituciones disponibles.</div>}
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;
