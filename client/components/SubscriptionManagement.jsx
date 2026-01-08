import React from 'react';
import { useAuth } from './useAuth';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const plan = (user?.plan || 'basic').toLowerCase();
  const networks = plan === 'enterprise' ? ['Hedera','XRP','Algorand'] : (plan === 'standard' ? ['Hedera','XRP'] : ['Hedera']);
  return (
    <div className="container-responsive pb-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Gestión de Suscripción</h1>
      <p className="text-gray-600 mb-6">Administra tu plan y redes activas.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="text-xl font-semibold">Plan Actual</div>
          <div className="mt-1 text-2xl font-bold">{plan === 'basic' ? 'Básico ($49/mes)' : (plan === 'standard' ? 'Standard ($99/mes)' : 'Enterprise (Custom)')}</div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Redes activas</div>
            <div className="flex flex-wrap gap-2">
              {networks.map((n) => (
                <span key={n} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">{n}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="text-xl font-semibold">Mejorar Plan</div>
          <p className="text-gray-700 mt-2">Desbloquea redes adicionales para mayor seguridad y resiliencia.</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Standard</div>
                <div className="text-sm text-gray-600">Hedera + XRP</div>
              </div>
              <a href="/precios" className="btn-secondary">Ver</a>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Enterprise</div>
                <div className="text-sm text-gray-600">Hedera + XRP + Algorand</div>
              </div>
              <a href="/precios" className="btn-primary">Contactar</a>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Incluye almacenamiento descentralizado con IPFS y respaldo en Filecoin.</div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
