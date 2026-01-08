import React from 'react';
import { Link } from 'react-router-dom';

const PlanUpgrade = ({ open, onClose, currentPlan = 'basic' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-[420px] p-6">
        <div className="text-xl font-bold text-gray-900">Mejora tu Plan</div>
        <div className="text-gray-700 mt-2">
          {currentPlan === 'basic' ? (
            <p>Sube a Standard para desbloquear XRP y aumentar la confianza de tus certificados.</p>
          ) : (
            <p>Sube a Enterprise para habilitar Algorand y lograr triple blindaje.</p>
          )}
        </div>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Standard ($99/mes)</span>
            <span>Hedera + XRP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Enterprise (Custom)</span>
            <span>Hedera + XRP + Algorand</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">Incluye almacenamiento descentralizado con IPFS y respaldo en Filecoin.</div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
          <Link to="/precios" className="btn-primary">Ver Planes</Link>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgrade;
