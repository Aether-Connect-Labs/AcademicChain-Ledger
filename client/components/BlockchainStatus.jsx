import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminAPI from './services/adminAPI';

const BlockchainStatus = () => {
  const [state, setState] = useState({ loading: true, hedera: null, xrp: null, algorand: null, backupStats: null, error: null });
  const [simulatedLevel, setSimulatedLevel] = useState(null);

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
        <div className="glass-card p-6">
          <div className="text-center text-slate-300">Cargando estado de redes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 pt-32">
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4 text-white" data-tour-id="blockchain-status-title">Estado de Respaldos Blockchain</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-3 text-slate-300">
              <span>Hedera Hashgraph</span>
              {renderBadge(Boolean(state.hedera?.connected))}
            </div>
            <span className="text-sm text-slate-500">{state.hedera?.network || 'testnet'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-3 text-slate-300">
              <span>XRP Ledger</span>
              {renderBadge(Boolean(state.xrp?.enabled))}
            </div>
            <span className="text-sm text-slate-500">{state.xrp?.network || 'disabled'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-3 text-slate-300">
              <span>Algorand</span>
              {renderBadge(Boolean(state.algorand?.enabled))}
            </div>
            <span className="text-sm text-slate-500">{state.algorand?.network || 'disabled'}</span>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-400">
          Cada credencial se respalda en redes independientes. Si una falla, las otras conservan la evidencia.
        </p>
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3 text-white">Estadísticas de Respaldo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-700 bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{state.backupStats?.totalCredentials || 0}</div>
              <div className="text-sm text-slate-400">Credenciales Totales</div>
            </div>
            <div className="border border-slate-700 bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{state.backupStats?.tripleBacked || 0}</div>
              <div className="text-sm text-slate-400">Con Triple Respaldo</div>
            </div>
            <div className="border border-slate-700 bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{state.backupStats?.hederaOnly || 0}</div>
              <div className="text-sm text-slate-400">Solo Hedera</div>
            </div>
          </div>
        </div>
        {(() => {
          const actualActiveCount = (state.hedera?.connected ? 1 : 0) + (state.xrp?.enabled ? 1 : 0) + (state.algorand?.enabled ? 1 : 0);
          const activeCount = simulatedLevel !== null ? simulatedLevel : actualActiveCount;
          
          return (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold mb-2 text-white">Nivel de Seguridad Actual</h4>
              <div className={`text-sm font-medium transition-colors duration-300 ${activeCount === 3 ? 'text-green-400' : activeCount === 2 ? 'text-yellow-400' : activeCount === 1 ? 'text-orange-400' : 'text-red-400'}`}>
                {activeCount === 3 && "⭐️⭐️⭐️ TRIPLE RESPALDO ACTIVO"}
                {activeCount === 2 && "⭐️⭐️ DOBLE RESPALDO"}
                {activeCount === 1 && "⭐️ RESPALDO BÁSICO"}
                {activeCount === 0 && "⚠️ SIN RESPALDOS"}
              </div>
              <p className="text-sm text-slate-300 mt-2">
                {activeCount === 3 && "Todas tus credenciales están respaldadas en 3 blockchains independientes. Máxima seguridad garantizada."}
                {activeCount === 2 && "Tus credenciales tienen respaldo doble. Considera activar la tercera red para protección completa."}
                {activeCount === 1 && "Solo una red activa. Tu protección es limitada."}
                {activeCount === 0 && "Activa al menos una red de respaldo para proteger tus credenciales."}
              </p>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-white">¿Listo para Protección Empresarial? (Selecciona un plan para simular)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div 
                    onClick={() => setSimulatedLevel(1)}
                    className={`border rounded-lg p-4 overflow-hidden cursor-pointer transition-all ${activeCount === 1 ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' : 'border-slate-700 hover:bg-slate-800/50'}`}
                  >
                    <div className="font-semibold text-white">Protección Básica</div>
                    <div className="text-sm text-slate-300">Solo Hedera</div>
                    <div className="text-sm font-mono mt-1 text-slate-400">$1.00/credencial</div>
                    <div className="text-xs text-slate-500 mt-1">Verificación básica</div>
                  </div>
                  <div 
                    onClick={() => setSimulatedLevel(2)}
                    className={`border rounded-lg p-4 overflow-hidden cursor-pointer transition-all ${activeCount === 2 ? 'border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500' : 'border-slate-700 hover:bg-slate-800/50'}`}
                  >
                    <div className="font-semibold text-white">Doble Blindaje</div>
                    <div className="text-sm text-slate-300">Hedera + XRP</div>
                    <div className="text-sm font-mono mt-1 text-slate-400">$0.70/credencial</div>
                    <div className="text-xs text-slate-500 mt-1">Evidencia inmutable avanzada</div>
                  </div>
                  <div 
                    onClick={() => setSimulatedLevel(3)}
                    className={`border rounded-lg p-4 overflow-hidden cursor-pointer transition-all ${activeCount === 3 ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500' : 'border-slate-700 hover:bg-slate-800/50'}`}
                  >
                    <div className="font-semibold text-white">Triple Blindaje Total</div>
                    <div className="text-sm text-slate-300">Hedera + XRP + Algorand</div>
                    <div className="text-sm font-mono mt-1 text-slate-400">$1.10/credencial</div>
                    <div className="text-xs text-slate-500 mt-1">Respaldo catastrófico y auditoría global</div>
                    <Link to="/agenda" className="btn-primary mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg w-full sm:w-auto text-black">Agendar Demo</Link>
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
