import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-gray-500 text-sm">{label}</div>
  </div>
);

const CredentialItem = ({ title, issuedBy, status }) => (
  <div className="flex items-center justify-between card">
    <div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{issuedBy}</div>
    </div>
    <div className={`badge ${status === 'verificada' ? 'badge-success' : 'badge-warning'}`}>{status}</div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Hola {user?.name || 'Usuario'}</h1>
      <p className="text-gray-600 mb-6">Este es tu panel. Aquí verás tus credenciales y su estado.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat value="2" label="Credenciales" />
        <Stat value="1" label="Verificadas" />
        <Stat value="1" label="Pendientes" />
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tus credenciales</h2>
        <div className="space-y-3">
          <CredentialItem title="Título Universitario" issuedBy="Universidad Central" status="verificada" />
          <CredentialItem title="Certificado de Curso" issuedBy="Instituto Digital" status="pendiente" />
        </div>
      </div>

      <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">Verificación rápida</h3>
        <p className="text-primary-800 mb-4">Escanea tu QR desde la sección Verificar para comprobar al instante.</p>
        <Link to="/verificar" className="inline-block btn-primary hover-lift">Ir a Verificar</Link>
      </div>

      <div className="mt-6 card">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de credenciales</h3>
        <p className="text-gray-700 mb-4">Consulta tus credenciales emitidas y obtén su QR y link.</p>
        <Link to="/student/portal" className="inline-block btn-secondary hover-lift">Ver Mis Credenciales</Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
