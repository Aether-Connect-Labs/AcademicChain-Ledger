import React, { useEffect, useState } from 'react';

const InstitutionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
    const url = `${API_BASE_URL}/api/universities/catalog`;
    setLoading(true);
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        setItems(data?.data?.universities || []);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
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