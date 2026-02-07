import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Toaster, toast } from 'react-hot-toast';
import { toGateway, getGateways } from './utils/ipfsUtils';
import n8nService from './services/n8nService';
import { useAuth } from './useAuth';

const TREASURY_ACCOUNT_ID = '0.0.7174400';
const ACL_TOKEN_ID = '0.0.7560139';

const plans = [
  { id: 'starter', name: 'Starter', credits: 100, priceUsd: 100, priceAcl: 80 },
  { id: 'business', name: 'Business', credits: 500, priceUsd: 450, priceAcl: 360 },
  { id: 'enterprise', name: 'Enterprise', credits: 1000, priceUsd: 800, priceAcl: 640 },
];

const XRP_WALLET = 'rSimulatedWalletAddressForBanxa'; // Wallet de Recaudación

const CreditRecharge = () => {
  const { user } = useAuth();
  const [method, setMethod] = useState('ACL');
  const [selected, setSelected] = useState(plans[0]);
  const [showModal, setShowModal] = useState(false);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [xrpPrice, setXrpPrice] = useState(0.5); // Default fallback price
  const [logoSrc, setLogoSrc] = useState(toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGateways = useRef(getGateways('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGwIndex = useRef(0);

  // Fetch XRP Price
  React.useEffect(() => {
    if (method === 'XRP') {
      fetch('/api/billing/xrp-price')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.price) setXrpPrice(data.price);
        })
        .catch(console.error);
    }
  }, [method]);

  const handleLogoError = () => {
    logoGwIndex.current = Math.min(logoGwIndex.current + 1, logoGateways.current.length - 1);
    const next = logoGateways.current[logoGwIndex.current] || logoSrc;
    setLogoSrc(next);
  };

  const aclBonusMultiplier = 1.25;
  const xrpBonusMultiplier = 1.10;

  const displayCredits = useMemo(() => {
    if (method === 'ACL') return Math.round(selected.priceAcl * aclBonusMultiplier);
    if (method === 'XRP') return Math.round(selected.credits * xrpBonusMultiplier); // 10% bonus for XRP
    return selected.credits;
  }, [method, selected]);

  const verifyAclPayment = async () => {
    if (!txId.trim()) {
      toast.error('Ingresa el Transaction ID');
      return;
    }
    setLoading(true);
    try {
      // Use n8n Service to verify on blockchain
      const data = await n8nService.verifyTransaction({
        transactionId: txId.trim(),
        method: method, // 'ACL' or 'XRP'
        expectedAmount: selected.priceAcl || selected.priceUsd,
        planId: selected.id
      });

      if (!data.success) {
        throw new Error(data.message || 'No se pudo verificar el pago');
      }
      toast.success(`Créditos acreditados: ${data.creditsGranted || selected.credits}`);
      setShowModal(false);
      setTxId('');
    } catch (e) {
      toast.error(e.message || 'Error verificando el pago con n8n');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan) => {
    try {
      toast.loading('Contactando NOWPayments vía n8n...', { id: 'payment-load' });

      // Call n8n Service to create payment intent
      const data = await n8nService.createPayment({
        planId: plan.id,
        amount: plan.priceUsd,
        currency: 'USD'
      });

      if (data.success && data.checkoutUrl) {
        toast.dismiss('payment-load');
        toast.success('Redirigiendo a pasarela de pago...');
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1500);
      } else {
        toast.dismiss('payment-load');
        toast.error('Error al iniciar pago. Intenta nuevamente.');
      }

    } catch (error) {
      console.error("Error al iniciar la compra:", error);
      toast.dismiss('payment-load');
      toast.error('Error de conexión con n8n.');
    }
  };

  return (
    <div className="container-responsive pb-10">
      <Toaster />
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Recargar Créditos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg border ${method === 'USD' ? 'bg-white text-gray-900 border-white' : 'bg-gray-900 text-gray-300 border-gray-700'}`}
            onClick={() => setMethod('USD')}
          >
            USD (Tarjeta)
          </button>
          <button
            className={`px-3 py-2 rounded-lg border ${method === 'XRP' ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-900 text-gray-300 border-gray-700'}`}
            onClick={() => setMethod('XRP')}
          >
            XRP Ledger
          </button>
          <button
            className={`px-3 py-2 rounded-lg border ${method === 'ACL' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-900 text-gray-300 border-gray-700'}`}
            onClick={() => setMethod('ACL')}
          >
            <span className="inline-flex items-center gap-2">
              <img
                src={logoSrc}
                onError={handleLogoError}
                alt="Logo ACL"
                className="h-6 w-6 rounded-full"
                style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
              />
              ACL Token
            </span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {plans.map((p, i) => {
          const active = selected.id === p.id;
          let priceLabel = `$${p.priceUsd} USD`;
          if (method === 'ACL') priceLabel = `${p.priceAcl} ACL`;
          if (method === 'XRP') priceLabel = `${(p.priceUsd * 2).toFixed(0)} XRP`; // Mock rate 1 USD = 2 XRP

          const bonus = displayCredits; // Simplification for card display logic, ideally per card

          // Correct bonus calculation for card display
          let cardCredits = p.credits;
          if (method === 'ACL') cardCredits = Math.round(p.priceAcl * aclBonusMultiplier);
          if (method === 'XRP') cardCredits = Math.round(p.credits * xrpBonusMultiplier);

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`card p-6 ${method === 'ACL' ? 'border-2 border-purple-500' : method === 'XRP' ? 'border-2 border-blue-500' : ''} ${active ? 'ring-2 ring-green-400' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-white">{p.name}</div>
                {method === 'ACL' && (
                  <span className="text-xs px-2 py-1 rounded bg-purple-600 text-white">Ahorro 20%</span>
                )}
                {method === 'XRP' && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Instantáneo</span>
                )}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-white">{priceLabel}</div>
              <div className="mt-1 text-sm text-gray-400">
                Créditos: <span className="font-semibold text-white">{cardCredits}</span>
              </div>
              <ul className="mt-4 text-sm text-gray-300 space-y-1">
                <li>Emisiones instantáneas</li>
                <li>Verificación pública</li>
                <li>Soporte prioritario</li>
              </ul>
              <div className="mt-5 flex items-center gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setSelected(p)}
                >
                  Seleccionar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (method === 'ACL' || method === 'XRP') setShowModal(true);
                    else handlePurchase(p);
                  }}
                >
                  Comprar
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {method === 'ACL' ? (
                  <>
                    <img src={logoSrc} onError={handleLogoError} alt="Logo ACL" className="h-7 w-7 rounded-full" />
                    <div className="text-lg font-bold text-white">Pagar con ACL</div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-blue-400">Pagar con XRP Ledger</div>
                )}
              </div>
              <button className="text-gray-400 hover:text-white" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400 mb-2">
                  {method === 'ACL' ? `Envía ${selected.priceAcl} ACL` : `Envía ${(selected.priceUsd / xrpPrice).toFixed(0)} XRP`}
                </div>
                <QRCode
                  value={method === 'ACL'
                    ? `ACL:${ACL_TOKEN_ID}|TO:${TREASURY_ACCOUNT_ID}|AMT:${selected.priceAcl}`
                    : `XRP:${XRP_WALLET}?dt=123456&amount=${(selected.priceUsd / xrpPrice).toFixed(6)}` // Standard XRP URI format
                  }
                  size={160}
                  bgColor="#111827"
                  fgColor="#ffffff"
                />
                <div className="mt-2 text-xs text-gray-400 text-center break-all">
                  {method === 'ACL' ? `Cuenta: ${TREASURY_ACCOUNT_ID}` : `Wallet: ${XRP_WALLET}`}
                </div>
                {method === 'ACL' && <div className="text-xs text-gray-400">Token: {ACL_TOKEN_ID}</div>}
              </div>
              <div>
                <div className="text-sm text-gray-300">Transaction ID / Hash</div>
                <input
                  className="mt-2 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  placeholder={method === 'ACL' ? "0.0.x-ssss-nnnn" : "E2B8..."}
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                />
                <div className="mt-4">
                  <button
                    className="btn-primary w-full"
                    disabled={loading}
                    onClick={verifyAclPayment}
                  >
                    {loading ? 'Verificando…' : 'Verificar y acreditar'}
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  Al confirmar, acreditaremos {displayCredits} créditos en tu cuenta.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditRecharge;
