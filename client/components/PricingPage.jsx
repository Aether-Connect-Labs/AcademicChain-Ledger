import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Básico', price: 'Gratis', features: ['Emisión limitada', 'Verificación instantánea', 'Soporte por email'] },
  { name: 'Startup', price: '$99/mes', features: ['Emisión masiva', 'Evidencia temporal', 'Métricas en tiempo real'] },
  { name: 'Enterprise', price: 'Contactar', features: ['Ilimitado', 'SLA y continuidad', 'Integración a medida'] },
];

const PricingPage = () => {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Precios</h1>
      <p className="text-gray-600 mb-6">Elige el plan que se adapta a tu institución.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.name} className="card p-6">
            <div className="text-xl font-semibold">{p.name}</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">{p.price}</div>
            <ul className="mt-3 text-sm text-gray-700 space-y-1">
              {p.features.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
            <div className="mt-4">
              <Link to="/agenda" className="btn-primary">Agendar Demo</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
