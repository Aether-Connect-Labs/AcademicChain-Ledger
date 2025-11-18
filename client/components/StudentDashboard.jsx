import React from 'react';
import { useAuth } from './useAuth';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-gray-500 text-sm">{label}</div>
  </div>
);

const CredentialItem = ({ title, issuedBy, status }) => (
  <div className="flex items-center justify-between px-4 py-3 border rounded-xl bg-white">
    <div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{issuedBy}</div>
    </div>
    <div className={`text-sm px-3 py-1 rounded-full ${status === 'verificada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Hola {user?.name || 'Usuario'}</h1>
      <p className="text-gray-600 mb-6">Este es tu panel. Aquí verás tus credenciales y su estado.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat value="2" label="Credenciales" />
        <Stat value="1" label="Verificadas" />
        <Stat value="1" label="Pendientes" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tus credenciales</h2>
        <div className="space-y-3">
          <CredentialItem title="Título Universitario" issuedBy="Universidad Central" status="verificada" />
          <CredentialItem title="Certificado de Curso" issuedBy="Instituto Digital" status="pendiente" />
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Verificación rápida</h3>
        <p className="text-blue-800 mb-4">Escanea tu QR desde la sección Verificar para comprobar al instante.</p>
        <a href="/verify" className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg">Ir a Verificar</a>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de credenciales</h3>
        <p className="text-gray-700 mb-4">Consulta tus credenciales emitidas y obtén su QR y link.</p>
        <a href="/credentials" className="inline-block bg-gray-800 text-white px-5 py-2 rounded-lg">Ver Mis Credenciales</a>
      </div>
    </div>
  );
};

export default StudentDashboard;