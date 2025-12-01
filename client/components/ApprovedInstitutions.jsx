import React, { useEffect, useState } from 'react';
import AdminAPI from './services/adminAPI';
import InstitutionCard from './InstitutionCard';
import LoadingSpinner from './ui/LoadingSpinner';

const ApprovedInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminAPI.getApprovedInstitutions();
      setInstitutions(data.data || []);
    } catch (e) {
      setError('No se pudo cargar instituciones aprobadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center gap-2"><LoadingSpinner /> Cargando instituciones...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Instituciones Aprobadas</h2>
      {institutions.length === 0 ? (
        <p>No hay instituciones</p>
      ) : (
        <div className="grid gap-3">
          {institutions.map((inst) => (
            <InstitutionCard key={inst._id || inst.id} institution={inst} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovedInstitutions;

