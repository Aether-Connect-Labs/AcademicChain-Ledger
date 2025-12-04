import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import QRCode from 'react-qr-code';
import axios from 'axios'; // Importar axios
import DocumentViewer from './ui/DocumentViewer';

const CredentialCard = ({ credential }) => {
  const link = `${window.location.origin}/verificar?tokenId=${encodeURIComponent(credential.tokenId)}\u0026serialNumber=${encodeURIComponent(credential.serialNumber)}`;
  const [docOpen, setDocOpen] = useState(false);
  const toGateway = (uri) => {
    if (!uri) return '';
    const gw = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    if (uri.startsWith('ipfs://')) return gw + uri.replace('ipfs://','');
    return uri;
  };
  const docUrl = toGateway(credential.ipfsURI);
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
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg flex items-center justify-center">
          <QRCode value={link} size={110} />
        </div>
        <div>
          <div className="text-sm text-gray-700 break-all">
            <span className="font-medium">Link:</span>
            <a className="ml-1 text-blue-600 hover:underline break-all" href={link} target="_blank" rel="noreferrer">{link}</a>
          </div>
          <div className="mt-2">
            {(credential.ipfsURI || '').startsWith('ipfs://') ? (
              <span className="badge badge-success">IPFS</span>
            ) : (
              <span className="badge badge-info">Demo PDF</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => navigator.clipboard.writeText(link)} className="btn-primary btn-sm">Copiar Link</button>
            <button className="btn-secondary btn-sm" onClick={() => setDocOpen(true)} disabled={!docUrl}>Ver documento</button>
          </div>
        </div>
      </div>
      <DocumentViewer open={docOpen} src={docUrl} title={credential.title || 'Documento'} onClose={() => setDocOpen(false)} />
    </div>
  );
};

const StudentCredentials = ({ demo = false }) => {
  const { token } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;
    let intervalId;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (demo) {
          const r = await axios.get(`${API}/api/demo/credentials`);
          setCredentials(r.data?.data || []);
        } else {
          const res = await axios.get(`${API}/api/credentials/mine`, { headers: { Authorization: `Bearer ${token}` } });
          setCredentials(res.data.credentials || []);
        }
      } catch (e) {
        console.error("Error fetching student credentials:", e);
        setError("Error al cargar las credenciales. Por favor, inténtalo de nuevo más tarde.");
        setCredentials([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    if (demo) {
      intervalId = setInterval(fetchData, 10000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [token, demo]);

  const filtered = credentials.filter(c =>
    (c.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.issuer || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mis Credenciales</h1>
      {demo && (
        <div className="mb-4 flex items-center gap-3">
          <span className="badge badge-info">Modo demo (auto-actualiza cada 10s)</span>
          <button className="btn-secondary btn-sm" onClick={() => {
            const API = import.meta.env.VITE_API_URL;
            setIsLoading(true);
            axios.get(`${API}/api/demo/credentials`).then(r => setCredentials(r.data?.data || [])).catch(() => {}).finally(() => setIsLoading(false));
          }}>Actualizar ahora</button>
        </div>
      )}
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
