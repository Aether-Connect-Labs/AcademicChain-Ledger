import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import QRCode from 'react-qr-code';
import DocumentViewer from './ui/DocumentViewer';
import { studentService } from './services/studentService';
import { verificationService } from './services/verificationService';
import { toGateway } from './utils/ipfsUtils';
import useAnalytics from './useAnalytics';

const CredentialCard = ({ credential, onDelete, onRevoke }) => {
  const link = `${window.location.origin}/#/verificar?tokenId=${encodeURIComponent(credential.tokenId)}\u0026serialNumber=${encodeURIComponent(credential.serialNumber)}`;
  const [docOpen, setDocOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [widgetCode, setWidgetCode] = useState('');
  const docUrl = toGateway(credential.ipfsURI);
  const evidenceUrl = `/#/credential/${encodeURIComponent(credential.tokenId)}/${encodeURIComponent(credential.serialNumber)}/evidence`;

  const handleShowWidget = async () => {
    if (widgetCode) {
      setShowWidget(true);
      return;
    }
    try {
      // Use tokenId-serialNumber as ID
      const id = `${credential.tokenId}-${credential.serialNumber}`;
      const res = await studentService.getWidgetCode(id);
      setWidgetCode(res.data?.html || res.html || 'Error generando widget');
      setShowWidget(true);
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el widget');
    }
  };

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
            <button className="btn-secondary btn-sm" onClick={handleShowWidget}>Embed Widget</button>
            <a className="btn-secondary btn-sm" href={evidenceUrl}>Ver evidencias</a>
            <button
              className="btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50"
              onClick={onRevoke}
            >
              Revocar
            </button>
            <button
              className="btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              Borrar
            </button>
            {credential.tokenId && credential.serialNumber && (
              <a
                className="btn-secondary btn-sm text-center"
                href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/nft/${credential.tokenId}-${credential.serialNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                HashScan
              </a>
            )}
          </div>
        </div>
      </div>
      <DocumentViewer open={docOpen} src={docUrl} title={credential.title || 'Documento'} onClose={() => setDocOpen(false)} />
      
      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Trust Widget & LinkedIn</h3>
            <p className="text-sm text-gray-600 mb-4">Copia este código para insertar el sello de verificación en tu sitio web o blog.</p>
            <textarea 
              className="w-full h-32 p-2 border rounded font-mono text-xs bg-gray-50 mb-4"
              readOnly
              value={widgetCode}
            />
            <div className="flex justify-between">
                <button 
                  className="btn-primary"
                  onClick={() => navigator.clipboard.writeText(widgetCode)}
                >
                  Copiar Código
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowWidget(false)}
                >
                  Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentCredentials = ({ demo = false }) => {
  const { token } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [selected, setSelected] = useState(null);
  const { trackCredentialOperation } = useAnalytics();

  const handleDelete = async (cred) => {
    const ok = window.confirm('¿Seguro que deseas borrar esta credencial de tu portal? Esta acción no afecta la revocación on-chain.');
    if (!ok) return;
    try {
      await studentService.deleteCredential({ tokenId: cred.tokenId, serialNumber: cred.serialNumber });
      setCredentials(prev => prev.filter(x => !(String(x.tokenId) === String(cred.tokenId) && String(x.serialNumber) === String(cred.serialNumber))));
      try {
        trackCredentialOperation({
          operation: 'delete',
          role: 'student',
          tokenId: cred.tokenId,
          serialNumber: String(cred.serialNumber || ''),
          title: cred.title,
          issuer: cred.issuer
        });
      } catch {}
    } catch (e) {
      alert('No se pudo borrar la credencial.');
    }
  };

  const handleRevoke = (cred) => {
    setSelected(cred);
    setRevokeReason('');
    setApiKey('');
    setRevokeOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selected || !revokeReason) return;
    setRevoking(true);
    try {
      await verificationService.revokeCredential(selected.tokenId, selected.serialNumber, revokeReason, apiKey || undefined);
      alert('Revocación enviada. Verificación pública reflejará el estado en cuanto el backend confirme.');
      try {
        trackCredentialOperation({
          operation: 'revoke',
          role: 'student',
          tokenId: selected.tokenId,
          serialNumber: String(selected.serialNumber || ''),
          reason: revokeReason
        });
      } catch {}
      setRevokeOpen(false);
    } catch (e) {
      alert('Error al revocar. Verifica si necesitas una API Key válida.');
    } finally {
      setRevoking(false);
    }
  };

  useEffect(() => {
    let intervalId;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (demo) {
          // Datos demo realistas
          const res = await studentService.getDemoCredentials();
          setCredentials(res.data?.credentials || []);
        } else {
          const res = await studentService.getMyCredentials();
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
            setIsLoading(true);
            studentService.getDemoCredentials().then(r => setCredentials(r.data?.data || [])).catch(() => {}).finally(() => setIsLoading(false));
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
        {!isLoading && !error && filtered.length > 0 && filtered.map(c => (
          <CredentialCard
            key={`${c.tokenId}-${c.serialNumber}-${c.id || ''}`}
            credential={c}
            onDelete={() => handleDelete(c)}
            onRevoke={() => handleRevoke(c)}
          />
        ))}
      </div>
      {revokeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRevokeOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-strong w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Revocar Credencial</h3>
            <p className="text-sm text-gray-600 mb-4">
              Token <strong>{selected?.tokenId}</strong> · Serial <strong>{selected?.serialNumber}</strong>
            </p>
            <div className="form-control mb-3">
              <label className="label-text">Razón</label>
              <select className="input-primary" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}>
                <option value="">Selecciona una razón...</option>
                <option value="PrivilegeWithdrawn">Privilegio Retirado</option>
                <option value="CessationOfOperation">Cese de Operaciones</option>
                <option value="AffiliationChanged">Cambio de Afiliación</option>
                <option value="Superseded">Reemplazada</option>
                <option value="Compromised">Comprometida</option>
              </select>
            </div>
            <div className="form-control mb-4">
              <label className="label-text">API Key (opcional)</label>
              <input className="input-primary" placeholder="x-api-key (si es requerida)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setRevokeOpen(false)} disabled={revoking}>Cancelar</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={confirmRevoke} disabled={!revokeReason || revoking}>
                {revoking ? 'Revocando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCredentials;
