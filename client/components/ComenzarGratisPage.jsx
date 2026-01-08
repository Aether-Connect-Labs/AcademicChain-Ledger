import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ComenzarGratisPage = () => {
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    const base = '/institution/register';
    const next = 'next=/institution/dashboard';
    const emailParam = superAdminEmail ? `super_admin_email=${encodeURIComponent(superAdminEmail)}` : '';
    const qs = [emailParam, next].filter(Boolean).join('&');
    navigate(`${base}?${qs}`);
  };

  return (
    <div className="container-responsive pb-16">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 mb-6">🚀 Plan Gratuito</div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Empieza en minutos, sin costo
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Emite y verifica tus primeras credenciales con límites generosos. Escala a medida que creces.
        </p>
      </div>

      <div className="grid grid-auto-fit gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-2">Incluido</h2>
          <ul className="text-gray-700 space-y-2">
            <li>✔ Emisión de credenciales limitadas</li>
            <li>✔ Verificación instantánea vía QR</li>
            <li>✔ Portal para alumnos y empleadores</li>
            <li>✔ API básica de integración</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-2">Cómo comenzar</h2>
          <ol className="text-gray-700 space-y-2 list-decimal list-inside">
            <li>Regístrate con tu correo institucional</li>
            <li>Configura tu institución y departamentos</li>
            <li>Emite tu primera credencial</li>
            <li>Comparte el QR y verifica</li>
          </ol>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-2">¿Listo para producción?</h2>
          <p className="text-gray-700 mb-4">Pásate a planes con emisión masiva, SLA y soporte dedicado.</p>
          <Link to="/precios" className="btn-secondary">Ver planes</Link>
        </div>
      </div>

      <div className="mt-12 max-w-lg mx-auto">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-2">Acceso al Panel de Autoridad</h3>
          <p className="text-gray-700 mb-4">Ingresa el correo del super administrador de tu institución para habilitar el panel de control.</p>
          <div className="space-y-3">
            <input
              type="email"
              value={superAdminEmail}
              onChange={(e) => setSuperAdminEmail(e.target.value)}
              placeholder="superadmin@institucion.edu"
              className="input-primary"
            />
            <button onClick={handleCreateAccount} className="btn-primary px-8 py-4 text-lg hover-lift w-full">
              Crear cuenta gratis
            </button>
            <p className="text-sm text-gray-500">Puedes continuar sin este campo, pero lo necesitarás para activar la “Gestión de Vigencia”.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComenzarGratisPage;
