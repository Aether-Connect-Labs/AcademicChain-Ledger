import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verificationService } from '../services/verificationService';

const CredentialEvidence = () => {
  const { tokenId, serialNumber } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const payload = await verificationService.getCredentialDetails(tokenId, serialNumber);
        if (!mounted) return;
        if (payload.success) {
          setState({ loading: false, data: payload.data, error: null });
        } else {
          setState({ loading: false, data: null, error: payload.message || 'Error al cargar evidencias' });
        }
      } catch (e) {
        if (!mounted) return;
        setState({ loading: false, data: null, error: e.message || 'Error al cargar evidencias' });
      }
    };
    load();
    return () => { mounted = false; };
  }, [tokenId, serialNumber]);

  if (state.loading) {
    return (
      <div className="container">
        <div className="card"><div className="text-center">Cargando evidencias...</div></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container">
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-700">{state.error}</div>
        </div>
      </div>
    );
  }

  const urls = state.data?.verificationUrls || {};
  const xrpl = state.data?.credential?.xrpl || null;
  const algo = state.data?.credential?.algorand || null;

  return (
    <div className="container space-y-6">
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Evidencias de Credencial</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Hedera (NFT Principal)</span>
              <span className="text-sm text-gray-600">Token {tokenId} · Serial {serialNumber}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Explorer</span>
                <a className="text-blue-600 hover:underline" href={urls.hashscan} target="_blank" rel="noreferrer">{urls.hashscan}</a>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">XRP Ledger (Evidencia)</span>
              <span className="text-sm text-gray-600">{xrpl?.network || 'disabled'}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Transaction</span>
                <span className="font-mono">{xrpl?.xrpTxHash || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Explorer</span>
                {urls.xrpl ? (
                  <a className="text-blue-600 hover:underline" href={urls.xrpl} target="_blank" rel="noreferrer">{urls.xrpl}</a>
                ) : <span className="text-gray-500">N/A</span>}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Algorand (Respaldo)</span>
              <span className="text-sm text-gray-600">{algo?.network || 'disabled'}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Transaction</span>
                <span className="font-mono">{algo?.algoTxId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Explorer</span>
                {urls.algorand ? (
                  <a className="text-blue-600 hover:underline" href={urls.algorand} target="_blank" rel="noreferrer">{urls.algorand}</a>
                ) : <span className="text-gray-500">N/A</span>}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          La verificación consulta redes independientes. El plan Enterprise muestra estas evidencias y ofrece respaldo múltiple.
        </p>
      </div>
    </div>
  );
};

export default CredentialEvidence;

