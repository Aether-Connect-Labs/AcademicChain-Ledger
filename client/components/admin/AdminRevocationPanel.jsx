import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../useAuth';
import { verificationService } from '../services/verificationService';
import RevocationHistory from './RevocationHistory.jsx';
 
const AdminRevocationPanel = () => {
  const { user } = useAuth();
  const superAdminEmail = String((import.meta.env && import.meta.env.VITE_SUPER_ADMIN_EMAIL) || '').trim().toLowerCase();
  const [search, setSearch] = useState({ tokenId: '', serialNumber: '' });
  const [status, setStatus] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [reason, setReason] = useState('Fraude detectado');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
 
  const canRevoke = (() => {
    const email = String(user?.email || '').toLowerCase();
    if (superAdminEmail && email && email === superAdminEmail) return true;
    return !!apiKey;
  })();
 
  const handleSearch = async () => {
    if (!search.tokenId || !search.serialNumber) {
      toast.error('Completa Token ID y Serial');
      return;
    }
    setLoading(true);
    setStatus(null);
    setStudentName('');
    try {
      const res = await verificationService.getCredentialStatus(search.tokenId.trim(), search.serialNumber.trim());
      const d = res?.data || res;
      setStatus({ status: d.status || 'UNKNOWN', revocationReason: d.revocationReason || null });
      try {
        const verify = await verificationService.verifyCredential(search.tokenId.trim(), search.serialNumber.trim());
        const cred = verify?.data?.credential;
        const attrs = Array.isArray(cred?.metadata?.attributes) ? cred.metadata.attributes : [];
        const stu = (attrs.find(a => a.trait_type === 'Student')?.value || '');
        setStudentName(stu);
      } catch {}
    } catch (e) {
      toast.error('No se encontró la credencial o error de conexión');
    } finally {
      setLoading(false);
    }
  };
 
  const handleRevoke = async () => {
    if (!canRevoke) {
      toast.error('Ingresa tu API Key o inicia sesión como super admin');
      return;
    }
    if (!search.tokenId || !search.serialNumber) {
      toast.error('Completa Token ID y Serial');
      return;
    }
    const ok = window.confirm('¿Estás seguro de anular esta credencial de forma permanente?');
    if (!ok) return;
    setRevoking(true);
    try {
      const r = await verificationService.revokeCredential(search.tokenId.trim(), search.serialNumber.trim(), reason, apiKey);
      const tx = r?.data?.hedera?.transactionId || r?.data?.transactionId || r?.transactionId || 'N/A';
      toast.success(`Credencial revocada. Tx Hedera: ${tx}`);
      await handleSearch();
    } catch (e) {
      toast.error('Error al revocar: verifica tu API Key');
    } finally {
      setRevoking(false);
    }
  };
 
  return (
    <div className="p-6">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', padding: '8px 12px' } }} />
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🛡️ Gestión de Vigencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            placeholder="Token ID (ej. 0.0.123456)"
            className="input-primary"
            value={search.tokenId}
            onChange={(e) => setSearch(s => ({ ...s, tokenId: e.target.value }))}
          />
          <input
            placeholder="Serial (ej. 1)"
            className="input-primary"
            value={search.serialNumber}
            onChange={(e) => setSearch(s => ({ ...s, serialNumber: e.target.value }))}
          />
          <select
            className="input-primary"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option>Error de datos</option>
            <option>Fraude detectado</option>
            <option>Sanción académica</option>
            <option>Otro</option>
          </select>
          <button onClick={handleSearch} disabled={loading} className="btn-primary">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-1">Estado</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${status?.status === 'REVOKED' ? 'bg-red-100 text-red-700' : (status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}`}>
              {status ? (status.status === 'REVOKED' ? 'Revocado' : 'Vigente') : 'Sin datos'}
            </div>
            {status?.revocationReason && (
              <div className="mt-2 text-sm text-gray-700">Motivo: {status.revocationReason}</div>
            )}
            {studentName && (
              <div className="mt-2 text-sm text-gray-700">Alumno: {studentName}</div>
            )}
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-1">Seguridad</div>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Acceso: {canRevoke ? 'Autorizado' : 'Restringido'}</div>
              {!canRevoke && (
                <input
                  placeholder="x-api-key"
                  className="input-primary"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              )}
              <button
                onClick={handleRevoke}
                disabled={revoking || !canRevoke || status?.status === 'REVOKED'}
                className={`btn-primary ${status?.status === 'REVOKED' ? 'opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} `}
              >
                {revoking ? 'Revocando...' : '🚫 Revocar título'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <RevocationHistory />
    </div>
  );
};
 
export default AdminRevocationPanel;
