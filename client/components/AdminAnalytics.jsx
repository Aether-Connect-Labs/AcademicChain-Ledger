import React, { useEffect, useMemo, useState } from 'react';
import AdminAPI from './services/adminAPI';
import { Toaster, toast } from 'react-hot-toast';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import SystemLatencyChart from './SystemLatencyChart';
import { useWebSocket } from './useWebSocket';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const AdminAnalytics = () => {
  const [hedera, setHedera] = useState({ hbars: null, network: 'unknown', connected: false });
  const [usage, setUsage] = useState([]);
  const [billing, setBilling] = useState({ items: [], currency: 'USD' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState(null);
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const init = async () => {
      setLoading(true); setError('');
      try {
        const [hb, us, bill, ver] = await Promise.allSettled([
          AdminAPI.getHederaBalance(),
          AdminAPI.getUsageByInstitution(),
          AdminAPI.getBillingConsumption(),
          AdminAPI.getVerificationStatus()
        ]);
        if (hb.status === 'fulfilled') {
          const h = hb.value?.data || hb.value || {};
          setHedera({ hbars: h.hbars || h.balance || null, network: h.network || (import.meta.env.VITE_HEDERA_NETWORK || 'testnet'), connected: !!(h.connected ?? true) });
        }
        if (us.status === 'fulfilled') {
          setUsage(us.value?.data || us.value || []);
        }
        if (bill.status === 'fulfilled') {
          setBilling(bill.value?.data || bill.value || { items: [], currency: 'USD' });
        }
        if (ver.status === 'fulfilled') {
          setVerification(ver.value?.data || ver.value || null);
        }
        
      } catch (e) {
        setError(e.message || 'Error de carga');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const onHealth = (payload) => {
      toast.success('Actualización de salud recibida');
      setVerification(prev => ({ ...(prev || {}), hedera: { ...(prev?.hedera || {}), connected: !!payload?.hedera?.connected } }));
    };
    subscribe('health:update', onHealth);
    return () => unsubscribe('health:update', onHealth);
  }, [subscribe, unsubscribe]);

  const treasuryAccount = '0.0.7174400';
  const lowHbar = useMemo(() => {
    const v = Number(hedera.hbars || 0);
    const threshold = parseFloat(import.meta.env.VITE_TREASURY_MIN_HBARS || '10');
    return v > 0 && v < threshold;
  }, [hedera]);

  const aclConsumptionSeries = useMemo(() => {
    const items = Array.isArray(billing.items) ? billing.items : [];
    const labels = items.map(i => i.date || i.period || '').slice(-30);
    const values = items.map(i => Number(i.aclConsumed || i.amount || 0)).slice(-30);
    return { labels, values };
  }, [billing]);

  const topInstitutions = useMemo(() => {
    const list = Array.isArray(usage) ? usage.slice() : [];
    list.sort((a, b) => Number(b.credentials || 0) - Number(a.credentials || 0));
    return list.slice(0, 10);
  }, [usage]);

  const aclChartData = useMemo(() => ({
    labels: aclConsumptionSeries.labels,
    datasets: [{
      label: 'ACL consumido',
      data: aclConsumptionSeries.values,
      borderColor: 'rgba(99, 102, 241, 0.8)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.25,
      pointRadius: 1.5,
      borderWidth: 2
    }]
  }), [aclConsumptionSeries]);

  const aclChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
  }), []);

  const rankingChartData = useMemo(() => ({
    labels: topInstitutions.map(i => String(i.name || i.universityName || i.universityId || '').slice(0, 16)),
    datasets: [{
      label: 'Títulos emitidos',
      data: topInstitutions.map(i => Number(i.credentials || 0)),
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    }]
  }), [topInstitutions]);

  const rankingChartOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
  }), []);

  return (
    <div className="container-responsive pb-8">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px' } }} />
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Analytics SuperAdmin</h1>
      <p className="text-gray-600 mb-6">Monitorea tesorería, consumo ACL, ranking y salud de red.</p>
      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`rounded-lg p-4 border ${lowHbar ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-sm text-gray-600">Tesorería HBAR ({treasuryAccount})</div>
              <div className="text-2xl font-bold">{hedera.hbars ?? 'N/A'}</div>
              <div className={`text-xs mt-1 ${lowHbar ? 'text-red-700' : 'text-gray-500'}`}>{lowHbar ? 'Recarga recomendada' : 'Nivel saludable'}</div>
            </div>
            <div className="rounded-lg p-4 border border-gray-200 bg-white">
              <div className="text-sm text-gray-600">Red Hedera</div>
              <div className="text-2xl font-bold">{hedera.network}</div>
              <div className={`text-xs mt-1 ${hedera.connected ? 'text-green-700' : 'text-red-700'}`}>{hedera.connected ? 'Conectado' : 'Desconectado'}</div>
            </div>
            <div className="rounded-lg p-4 border border-gray-200 bg-white">
              <div className="text-sm text-gray-600">Instituciones activas</div>
              <div className="text-2xl font-bold">{Array.isArray(usage) ? usage.length : 0}</div>
            </div>
            <div className="rounded-lg p-4 border border-gray-200 bg-white">
              <div className="text-sm text-gray-600">ACL consumido (últimos)</div>
              <div className="text-2xl font-bold">{aclConsumptionSeries.values.reduce((a,b)=>a+Number(b||0),0)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-soft h-[360px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Métricas del Token ACL</h3>
                <button className="btn-secondary" onClick={async () => { try { const r = await AdminAPI.getBillingConsumption(); setBilling(r?.data || r || { items: [] }); toast.success('Actualizado'); } catch {} }}>Actualizar</button>
              </div>
              <div className="h-[300px]">
                <Line data={aclChartData} options={aclChartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-soft h-[360px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Ranking de Instituciones</h3>
                <button className="btn-secondary" onClick={async () => { try { const r = await AdminAPI.getUsageByInstitution(); setUsage(r?.data || r || []); toast.success('Actualizado'); } catch {} }}>Actualizar</button>
              </div>
              <div className="h-[300px]">
                <Bar data={rankingChartData} options={rankingChartOptions} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Estado de Red</h3>
              <button className="btn-secondary" onClick={async () => { try { const r = await AdminAPI.getVerificationStatus(); setVerification(r?.data || r || null); toast.success('Actualizado'); } catch {} }}>Actualizar</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600">Hedera</div>
                <div className="text-2xl font-bold">{verification?.hedera?.connected ? 'Conectado' : 'Desconectado'}</div>
                <div className="text-xs text-gray-500 mt-1">Balance: {verification?.hedera?.accountBalance ?? 'N/A'} HBAR</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Servicio</div>
                <div className="text-2xl font-bold">{verification?.service?.name || 'N/A'}</div>
                <div className="text-xs text-gray-500 mt-1">Versión: {verification?.service?.version || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Timestamp</div>
                <div className="text-2xl font-bold">{verification?.timestamp ? new Date(verification.timestamp).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <div className="mt-6">
              <SystemLatencyChart />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
