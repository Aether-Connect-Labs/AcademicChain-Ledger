import React from 'react';

const ComenzarGratisPage = () => {
  return (
    <div className="container-responsive py-16">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 mb-6">🚀 Plan Gratuito</div>
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
          <a href="/pricing" className="btn-secondary">Ver planes</a>
        </div>
      </div>

      <div className="mt-12 text-center">
        <a href="/register" className="btn-primary px-8 py-4 text-lg hover-lift">Crear cuenta gratis</a>
      </div>
    </div>
  );
};

export default ComenzarGratisPage;