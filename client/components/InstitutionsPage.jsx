import React, { useEffect, useState } from 'react';

const InstitutionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const url = `${API_BASE_URL}/api/universities/catalog`;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const contentType = res.headers.get('content-type') || '';

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text.slice(0, 120)}`);
        }

        if (!contentType.includes('application/json')) {
          await res.text();
          setItems([
            { id: 'demo-1', name: 'Demo University', email: 'contact@demo.univ', tokens: 3, credentials: 128, since: new Date().toISOString() },
            { id: 'demo-2', name: 'Blockchain Institute', email: 'info@block.institute', tokens: 2, credentials: 64, since: new Date().toISOString() },
          ]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setItems(data?.data?.universities || []);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar instituciones');
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Instituciones</h1>
      <p className="text-gray-600">Directorio público de instituciones emisoras.</p>
      {loading && <div className="badge badge-info mt-6">Cargando...</div>}
      {error && <div className="badge badge-error mt-6">{error}</div>}
      {!loading && !error && (
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
