import React from 'react';
import { Link } from 'react-router-dom';

const PendingApproval = () => {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'soporte@tu-institucion.edu';
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-soft">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">⏳</span>
            <h1 className="text-xl font-extrabold text-yellow-900">Tu institución está en revisión</h1>
          </div>
          <p className="text-yellow-800 mb-4">
            Hemos recibido tu solicitud de acceso institucional. Un administrador debe aprobarla antes de poder emitir credenciales o acceder al panel de institución.
          </p>
          <div className="space-y-3 text-sm text-yellow-900">
            <p>Qué puedes hacer ahora:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verifica que usaste tu correo corporativo institucional.</li>
              <li>Si necesitas acelerar el proceso, contacta al soporte en <a className="text-blue-700 hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</li>
              <li>Si ya fuiste aprobado, vuelve a iniciar sesión.</li>
            </ul>
          </div>
          <div className="mt-6 flex gap-3">
            <Link to="/login" className="btn-secondary">Cerrar sesión</Link>
            <Link to="/instituciones" className="btn-primary">Ver instituciones</Link>
          </div>
        </div>
        <div className="mt-6 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Cómo funciona la aprobación?</h2>
          <p className="text-gray-700">Un administrador valida el dominio de tu correo y activa tu cuenta institucional. Tras la aprobación, verás el panel de institución y las herramientas de emisión.</p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

