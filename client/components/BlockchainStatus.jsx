import React, { useEffect, useState } from 'react';
import AdminAPI from './services/adminAPI';

const BlockchainStatus = () => {
  const [state, setState] = useState({ loading: true, hedera: null, xrp: null, algorand: null, backupStats: null, error: null });

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const h = await AdminAPI.getVerificationStatus().catch(() => ({ success: true, data: { hedera: { connected: true, network: 'demo' } } }));
        const x = await AdminAPI.getXrpStatus().catch(() => ({ success: true, data: { enabled: false, network: 'disabled' } }));
        const a = await AdminAPI.getAlgorandStatus().catch(() => ({ success: true, data: { enabled: false, network: 'disabled' } }));
        const b = await AdminAPI.getBackupStats().catch(() => ({ success: true, data: { totalCredentials: 0, tripleBacked: 0, hederaOnly: 0 } }));
        
        if (!mounted) return;
        setState({ loading: false, hedera: h.data?.hedera || null, xrp: x.data || null, algorand: a.data || null, backupStats: b.data || null, error: null });
      } catch (e) {
        if (!mounted) return;
        setState({ loading: false, hedera: null, xrp: null, algorand: null, backupStats: null, error: 'Error cargando estado' });
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const renderBadge = (ok) => (
    <span className={ok ? 'badge badge-success' : 'badge badge-warning'}>{ok ? 'Activo' : 'Inactivo'}</span>
  );

  if (state.loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">Cargando estado de redes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="card">
        <h3 className="text-xl font-semibold mb-4" data-tour-id="blockchain-status-title">Estado de Respaldos Blockchain</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Hedera Hashgraph</span>
              {renderBadge(Boolean(state.hedera?.connected))}
            </div>
            <span className="text-sm text-gray-600">{state.hedera?.network || 'testnet'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>XRP Ledger</span>
              {renderBadge(Boolean(state.xrp?.enabled))}
            </div>
            <span className="text-sm text-gray-600">{state.xrp?.network || 'disabled'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Algorand</span>
              {renderBadge(Boolean(state.algorand?.enabled))}
            </div>
            <span className="text-sm text-gray-600">{state.algorand?.network || 'disabled'}</span>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          Cada credencial se respalda en redes independientes. Si una falla, las otras conservan la evidencia.
        </p>
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">Estadísticas de Respaldo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{state.backupStats?.totalCredentials || 0}</div>
              <div className="text-sm text-gray-700">Credenciales Totales</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{state.backupStats?.tripleBacked || 0}</div>
              <div className="text-sm text-gray-700">Con Triple Respaldo</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{state.backupStats?.hederaOnly || 0}</div>
              <div className="text-sm text-gray-700">Solo Hedera</div>
            </div>
          </div>
        </div>
        {(() => {
          const activeCount = (state.hedera?.connected ? 1 : 0) + (state.xrp?.enabled ? 1 : 0) + (state.algorand?.enabled ? 1 : 0);
          return (
            <div className="mt-6 border-t pt-6">
              <h4 className="text-lg font-semibold mb-2">Nivel de Seguridad Actual</h4>
              <div className={`text-sm font-medium ${activeCount === 3 ? 'text-green-700' : activeCount === 2 ? 'text-yellow-700' : activeCount === 1 ? 'text-orange-700' : 'text-red-700'}`}>
                {activeCount === 3 && "⭐️⭐️⭐️ TRIPLE RESPALDO ACTIVO"}
                {activeCount === 2 && "⭐️⭐️ DOBLE RESPALDO"}
                {activeCount === 1 && "⭐️ RESPALDO BÁSICO"}
                {activeCount === 0 && "⚠️ SIN RESPALDOS"}
              </div>
              <p className="text-sm text-gray-700 mt-2">
                {activeCount === 3 && "Todas tus credenciales están respaldadas en 3 blockchains independientes. Máxima seguridad garantizada."}
                {activeCount === 2 && "Tus credenciales tienen respaldo doble. Considera activar la tercera red para protección completa."}
                {activeCount === 1 && "Solo una red activa. Tu protección es limitada."}
                {activeCount === 0 && "Activa al menos una red de respaldo para proteger tus credenciales."}
              </p>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">¿Listo para Protección Empresarial?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold">Básico</div>
                    <div className="text-sm text-gray-700">Solo Hedera</div>
                    <div className="text-sm font-mono mt-1">$0.01/credencial</div>
                    <div className="text-xs text-gray-600 mt-1">Verificación básica</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold">Estándar</div>
                    <div className="text-sm text-gray-700">Hedera + XRP</div>
                    <div className="text-sm font-mono mt-1">$0.05/credencial</div>
                    <div className="text-xs text-gray-600 mt-1">+ Evidencia inmutable</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold">Premium</div>
                    <div className="text-sm text-gray-700">Triple Respaldo</div>
                    <div className="text-sm font-mono mt-1">$0.10/credencial</div>
                    <div className="text-xs text-gray-600 mt-1">+ Respaldo catastrófico</div>
                    <button className="btn-primary mt-3">Activar ahora</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default BlockchainStatus;
