import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import QRCode from 'react-qr-code';
import axios from 'axios'; // Importar axios

const CredentialCard = ({ credential }) =\u003e {
  const link = `${window.location.origin}/verify?tokenId=${encodeURIComponent(credential.tokenId)}\u0026serialNumber=${encodeURIComponent(credential.serialNumber)}`;
  return (
    \u003cdiv className="border rounded-xl bg-white p-4 space-y-3"\u003e
      \u003cdiv className="flex justify-between items-center"\u003e
        \u003cdiv\u003e
          \u003cdiv className="font-semibold text-gray-900"\u003e{credential.title}\u003c/div\u003e
          \u003cdiv className="text-sm text-gray-600"\u003e{credential.issuer}\u003c/div\u003e
        \u003c/div\u003e
        \u003cspan className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"\u003eemitida\u003c/span\u003e
      \u003c/div\u003e
      \u003cdiv className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"\u003e
        \u003cdiv className="bg-gray-50 p-3 rounded-lg flex items-center justify-center"\u003e
          \u003cQRCode value={link} size={128} /\u003e
        \u003c/div\u003e
        \u003cdiv\u003e
          \u003cp className="text-sm text-gray-700 break-all"\u003eLink: {link}\u003c/p\u003e
          \u003cbutton onClick={() =\u003e navigator.clipboard.writeText(link)} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg"\u003eCopiar Link\u003c/button\u003e
        \u003c/div\u003e
      \u003c/div\u003e
    \u003c/div\u003e
  );
};

const StudentCredentials = () =\u003e {
  const { token } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  useEffect(() =\u003e {
    const fetchData = async () =\u003e {
      setIsLoading(true);
      setError(null);
      try {
        const API = import.meta.env.VITE_API_URL;
        if (!API) {
          throw new Error("VITE_API_URL no está definida.");
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

  const filtered = credentials.filter(c =\u003e
    (c.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.issuer || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    \u003cdiv className="max-w-6xl mx-auto px-4 py-8"\u003e
      \u003ch1 className="text-2xl font-bold mb-4"\u003eMis Credenciales\u003c/h1\u003e
      \u003cdiv className="mb-6"\u003e
        \u003cinput
          value={query}
          onChange={e =\u003e setQuery(e.target.value)}
          placeholder="Buscar por título o institución"
          className="w-full border rounded-lg px-3 py-2"
        /\u003e
      \u003c/div\u003e
      \u003cdiv className="grid grid-cols-1 md:grid-cols-2 gap-6"\u003e
        {isLoading \u0026\u0026 \u003cp className="text-gray-600"\u003eCargando credenciales...\u003c/p\u003e}
        {error \u0026\u0026 \u003cp className="text-red-500"\u003eError: {error}\u003c/p\u003e}
        {!isLoading \u0026\u0026 !error \u0026\u0026 filtered.length === 0 \u0026\u0026 (\u003cp className="text-gray-600"\u003eNo hay credenciales\u003c/p\u003e)}
        {!isLoading \u0026\u0026 !error \u0026\u0026 filtered.length \u003e 0 \u0026\u0026 filtered.map(c =\u003e \u003cCredentialCard key={c.id} credential={c} /\u003e)}
      \u003c/div\u003e
    \u003c/div\u003e
  );
};

export default StudentCredentials;