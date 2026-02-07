import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';

const Stat = ({ value, label }) => (
  <div className="text-center glass-panel p-4">
    <div className="text-3xl font-bold text-primary-400 font-display">{value}</div>
    <div className="text-slate-400 text-sm mt-1">{label}</div>
  </div>
);

const CredentialItem = ({ title, issuedBy, status }) => (
  <div className="flex items-center justify-between glass-card p-4 hover:bg-white/5 transition-colors">
    <div>
      <div className="font-semibold text-white">{title}</div>
      <div className="text-sm text-slate-400">{issuedBy}</div>
    </div>
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${status === 'verificada' ? 'bg-success-500/20 text-success-300 border-success-500/30' : 'bg-warning-500/20 text-warning-300 border-warning-500/30'}`}>{status}</div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container-responsive pb-10 pt-24 sm:pt-32 relative z-10">
      <h1 className="text-3xl font-extrabold text-white mb-2 font-display">
        Hola <span className="text-gradient">{user?.name || 'Usuario'}</span>
      </h1>
      <p className="text-slate-400 mb-8">Este es tu panel. Aquí verás tus credenciales y su estado.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat value="2" label="Credenciales" />
        <Stat value="1" label="Verificadas" />
        <Stat value="1" label="Pendientes" />
      </div>

      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-6 font-display">Tus credenciales</h2>
        <div className="space-y-3">
          <CredentialItem title="Título Universitario" issuedBy="Universidad Central" status="verificada" />
          <CredentialItem title="Certificado de Curso" issuedBy="Instituto Digital" status="pendiente" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-primary-300 mb-2">Verificación rápida</h3>
          <p className="text-slate-300 mb-4 text-sm">Escanea tu QR desde la sección Verificar para comprobar al instante.</p>
          <Link to="/verificar" className="btn-primary inline-block text-sm">Ir a Verificar</Link>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Gestión de credenciales</h3>
          <p className="text-slate-400 mb-4 text-sm">Consulta tus credenciales emitidas y obtén su QR y link.</p>
          <Link to="/student/portal" className="btn-secondary inline-block text-sm">Ver Mis Credenciales</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
