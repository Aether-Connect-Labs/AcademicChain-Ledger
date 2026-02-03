import React from 'react';
import { Link } from 'react-router-dom';

const tiers = [
  {
    name: 'Protección Básica',
    infra: 'Solo Hedera',
    cost: '$0.50 / credencial',
    storage: 'IPFS + Filecoin',
    verification: 'Verificación básica',
    integration: 'Portal estándar',
    badge: ['Hedera', 'IPFS', 'Filecoin'],
    cta: { label: 'Agendar Demo', to: '/agenda' },
  },
  {
    name: 'Doble Blindaje',
    infra: 'Hedera + XRP Ledger',
    cost: '$0.62 / credencial',
    storage: 'IPFS + Filecoin',
    verification: 'Evidencia inmutable avanzada',
    integration: 'API de integración',
    badge: ['Hedera', 'XRP', 'IPFS', 'Filecoin'],
    cta: { label: 'Agendar Demo', to: '/agenda' },
  },
  {
    name: 'Triple Blindaje Total',
    infra: 'Hedera + XRP + Algorand',
    cost: '$0.80 / credencial',
    storage: 'Bóveda Dedicada (Filecoin)',
    verification: 'Respaldo catastrófico y auditoría global',
    integration: 'On‑prem + SLA personalizado',
    badge: ['Hedera', 'XRP', 'Algorand', 'Filecoin'],
    cta: { label: 'Agendar Demo', to: '/agenda' },
  },
];

const PricingPage = () => {
  return (
    <div className="container-responsive pb-10 pt-24 sm:pt-32">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Precios</h1>
      <p className="text-gray-600 mb-8">Escala según tus necesidades. Sin fricción.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{t.name}</div>
              <div className="flex items-center gap-2">
                {t.badge.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{t.cost}</div>
            <div className="mt-3 text-sm text-gray-700">
              <div className="font-medium text-gray-900">{t.infra}</div>
              <div className="mt-1">Almacenamiento: {t.storage}</div>
              <div className="mt-1">Nivel de verificación: {t.verification}</div>
              <div className="mt-1">Integración: {t.integration}</div>
            </div>
            <div className="mt-5">
              <Link to={t.cta.to} className="btn-primary">{t.cta.label}</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
