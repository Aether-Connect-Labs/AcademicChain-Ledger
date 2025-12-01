import React, { useEffect, useState } from 'react';
import AdminAPI from './services/adminAPI';
import InstitutionCard from './InstitutionCard';
import LoadingSpinner from './ui/LoadingSpinner';

const PendingInstitutions = ({ onActionComplete }) => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminAPI.getPendingInstitutions();
      setInstitutions(data.data || []);
    } catch (e) {
      setError('No se pudo cargar instituciones pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    if (!id) return;
    if (!window.confirm('¿Estás seguro de aprobar esta institución?')) return;
    setActionLoading(id);
    try {
      await AdminAPI.approveInstitution(id);
      await load();
      onActionComplete && onActionComplete();
      alert('✅ Institución aprobada exitosamente');
    } catch {
      alert('❌ Error al aprobar institución');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    if (!id) return;
    const reason = prompt('Ingresa el motivo del rechazo (opcional):');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await AdminAPI.rejectInstitution(id);
      await load();
      onActionComplete && onActionComplete();
      alert('❌ Institución rechazada');
    } catch {
      alert('Error al rechazar institución');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center gap-2"><LoadingSpinner /> Cargando instituciones...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Instituciones Pendientes de Aprobación</h2>
      {institutions.length === 0 ? (
        <p>No hay instituciones pendientes</p>
      ) : (
        <div className="grid gap-3">
          {institutions.map((inst) => (
            <InstitutionCard key={inst._id || inst.id} institution={inst} onApprove={approve} onReject={reject} showActions busy={actionLoading === (inst._id || inst.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingInstitutions;
