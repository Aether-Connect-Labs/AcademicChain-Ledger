import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import QRCode from 'react-qr-code';
import axios from 'axios'; // Importar axios

const CredentialCard = ({ credential }) => {
  const link = `${window.location.origin}/verify?tokenId=${encodeURIComponent(credential.tokenId)}\u0026serialNumber=${encodeURIComponent(credential.serialNumber)}`;
  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold text-gray-900">{credential.title}</div>
          <div className="text-sm text-gray-600">{credential.issuer}</div>
        </div>
        <span className="badge badge-success text-xs">emitida</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-center">
          <QRCode value={link} size={128} />
        </div>
        <div>
          <p className="text-sm text-gray-700 break-all">Link: {link}</p>
          <button onClick={() => navigator.clipboard.writeText(link)} className="mt-2 btn-primary">Copiar Link</button>
        </div>
      </div>
    </div>
  );
};

const StudentCredentials = () => {
  const { token } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let API = import.meta.env.VITE_API_URL
        if (typeof API === 'undefined') {
          API = ''
        }
        const res = await axios.get(`${API}/api/credentials/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCredentials(res.data.credentials || []);
      } catch (e) {
        console.error("Error fetching student credentials:", e);
        setError("Error al cargar las credenciales. Por favor, inténtalo de nuevo más tarde.");
        setCredentials([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filtered = credentials.filter(c =>
    (c.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.issuer || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mis Credenciales</h1>
      <div className="mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por título o institución"
          className="input-primary"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading && (
          <div className="card">
            <div className="spinner w-6 h-6 mr-2"></div>
            <p className="text-gray-600">Cargando credenciales...</p>
          </div>
        )}
        {error && (
          <div className="card">
            <p className="badge badge-error">Error</p>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="card">
            <p className="badge badge-info">Sin resultados</p>
            <p className="text-gray-600 mt-2">No hay credenciales</p>
          </div>
        )}
        {!isLoading && !error && filtered.length > 0 && filtered.map(c => <CredentialCard key={c.id} credential={c} />)}
      </div>
    </div>
  );
};

export default StudentCredentials;