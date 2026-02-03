import React, { useEffect, useMemo, useState } from 'react';
import PendingInstitutions from './PendingInstitutions';
import ApprovedInstitutions from './ApprovedInstitutions';
import StatsChart from './StatsChart';
import RecentInstitutions from './RecentInstitutions';
import AdminAPI from './services/adminAPI';
import { useWebSocket } from './useWebSocket';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import SystemLatencyChart from './SystemLatencyChart';
import { theme } from './themeConfig';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [planTab, setPlanTab] = useState('basic');
  const [usage, setUsage] = useState([]);
  const [billing, setBilling] = useState({ items: [], currency: 'USD', rates: {} });
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [healthRealtime, setHealthRealtime] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keyResult, setKeyResult] = useState(null);
  const navigate = useNavigate();
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  const loadDashboardStats = async () => {
    try {
      setError(null);
      const res = await AdminAPI.getInstitutionsStats();
      const d = res.data || res;
      setStats({
        pending: Number(d.pending || 0),
        approved: Number(d.approved || 0),
        rejected: Number(d.rejected || 0),
        total: Number(d.total || (Number(d.pending || 0) + Number(d.approved || 0) + Number(d.rejected || 0)))
      });
      setRecent(Array.isArray(d.recent) ? d.recent : []);
    } catch (err) {
      setError('Error al cargar estadísticas');
      setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
      setRecent([]);
    }
  };

  useEffect(() => { loadDashboardStats(); }, []);

  const loadUsage = async () => {
    try {
      const res = await AdminAPI.getUsageByInstitution();
      const d = res.data || res;
      setUsage(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []));
    } catch (error) {
      setError('Error al cargar uso por institución');
      toast.error('Error al cargar uso por institución');
    }
  };

  const loadBilling = async () => {
    try {
      const res = await AdminAPI.getBillingConsumption();
      const d = res.data || res;
      const items = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      setBilling({ items, currency: d?.currency || 'USD', rates: d?.rates || {} });
    } catch {}
  };

  const loadSystemStatus = async () => {
    try {
      const res = await AdminAPI.getSystemStatus();
      const d = res.data || res;
      setSystemStatus(d);
      setAlerts(Array.isArray(d?.alerts) ? d.alerts : []);
    } catch (error) {
      toast('Sistema: estado no disponible', { style: { background: '#FEE2E2', color: '#7F1D1D', border: '1px solid #EF4444' } });
    }
  };

  useEffect(() => {
    loadUsage();
    loadBilling();
    loadSystemStatus();
    const t1 = setInterval(() => { loadSystemStatus(); }, 30000);
    const t2 = setInterval(() => { loadUsage(); loadBilling(); }, 60000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  useEffect(() => {
    const onHealth = (payload) => {
      setHealthRealtime(payload);
      setSystemStatus(payload);
      setAlerts(Array.isArray(payload?.alerts) ? payload.alerts : []);
    };
    const onAlert = (a) => {
      setAlerts((prev) => [a, ...prev].slice(0, 20));
      const sev = String(a?.severity || 'info').toLowerCase();
      const styles = {
        warning: { background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' },
        error: { background: '#FEE2E2', color: '#7F1D1D', border: '1px solid #EF4444' },
        info: { background: '#DBEAFE', color: '#1E3A8A', border: '1px solid #3B82F6' },
        success: { background: '#D1FAE5', color: '#065F46', border: '1px solid #10B981' }
      };
      const style = styles[sev] || styles.info;
      const title = a?.service ? `${String(a.service).toUpperCase()}` : 'Sistema';
      const msg = a?.message || a?.code || 'Alerta del sistema';
      toast(`${title}: ${msg}`, { style });
    };
    subscribe('health:update', onHealth);
    subscribe('system:alert', onAlert);
    return () => {
      unsubscribe('health:update', onHealth);
      unsubscribe('system:alert', onAlert);
    };
  }, [subscribe, unsubscribe]);

  const formatCurrency = useMemo(() => {
    const cur = billing.currency || 'USD';
    const symbol = cur === 'USD' ? '$' : '';
    return (v) => `${symbol}${Number(v || 0).toFixed(2)} ${cur}`;
  }, [billing]);

  const mapCost = useMemo(() => Object.fromEntries((billing.items || []).map(i => [String(i.universityId), i.estimatedCost])), [billing]);
  const totalCreds = useMemo(() => (usage || []).reduce((a, b) => a + Number(b.credentials || 0), 0), [usage]);
  const totalCost = useMemo(() => (billing.items || []).reduce((a, b) => a + Number(b.estimatedCost || 0), 0), [billing]);
  const services = systemStatus?.services || {};
  const serviceList = ['mongodb', 'redis', 'hedera', 'xrpl', 'rate_oracle'];
  const healthyCount = serviceList.reduce((c, n) => c + (services?.[n]?.healthy ? 1 : 0), 0);
  const healthLabel = healthyCount === serviceList.length ? 'Óptimo' : 'Degradado';
  const topInstitutions = useMemo(() => {
    const base = Array.isArray(usage) ? usage.slice(0, 5) : [];
    return base.map(u => ({ ...u, estimatedCost: mapCost[String(u.universityId)] || 0 }));
  }, [usage, mapCost]);

  const loadBookings = async () => {
    try {
      setBookingError('');
      setBookingLoading(true);
      const res = await AdminAPI.getBookings();
      const data = res.data || res;
      setBookings(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setBookingError('Error al cargar reservas');
      setBookings([]);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings();
  }, [activeTab]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error de conexión</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadDashboardStats} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">Reintentar conexión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1224] min-h-screen" style={{ paddingLeft: theme.spacing.sectionPx, paddingRight: theme.spacing.sectionPx, paddingBottom: theme.spacing.sectionPb }}>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', padding: '8px 12px' } }} />
      <h1 className="text-3xl font-bold text-white mb-6">Panel de Administración</h1>
      <div className="mb-6">
        <div className="max-w-5xl mx-auto rounded-2xl border border-red-500/40 bg-red-600/10 p-6 text-center">
          <div className="text-white text-lg font-semibold">Estado de Alertas</div>
          <div className="mt-2 text-red-300 text-sm">Alertas activas: {(alerts || []).length}</div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded shadow">
          <div className="text-sm text-white/70">Instituciones activas</div>
          <div className="text-2xl font-semibold text-white">{stats.approved}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded shadow">
          <div className="text-sm text-white/70">Credenciales totales</div>
          <div className="text-2xl font-semibold text-white">{totalCreds}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded shadow">
          <div className="text-sm text-white/70">Facturación estimada</div>
          <div className="text-2xl font-semibold text-white">{formatCurrency(totalCost)}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded shadow">
          <div className="text-sm text-white/70">Salud del sistema</div>
          <div className="text-2xl font-semibold text-white">{healthLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 rounded-xl border border-white/10 shadow-soft p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Top 5 Instituciones</h3>
            <button className="btn-secondary" onClick={loadUsage}>Actualizar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Institución</th>
                  <th className="px-3 py-2">Credenciales</th>
                  <th className="px-3 py-2">Verificaciones 30d</th>
                  <th className="px-3 py-2">Costo estimado</th>
                </tr>
              </thead>
              <tbody>
                {topInstitutions.map((i) => (
                  <tr key={i.universityId} className="border-t border-white/10">
                    <td className="px-3 py-2">{i.universityName || i.email || i.universityId}</td>
                    <td className="px-3 py-2">{i.credentials}</td>
                    <td className="px-3 py-2">{i.verifications30d || 0}</td>
                    <td className="px-3 py-2">{formatCurrency(i.estimatedCost || 0)}</td>
                  </tr>
                ))}
                {topInstitutions.length === 0 && (
                  <tr><td className="px-3 py-2 text-white/70" colSpan={4}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 shadow-soft p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Salud del Sistema</h3>
            <button className="btn-secondary" onClick={loadSystemStatus}>Actualizar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceList.map((name) => {
              const d = services?.[name] || {};
              const ok = !!d.healthy;
              const lat = Number(d.latencyMs || 0);
              return (
                <div key={name} className={`p-4 rounded border ${ok ? 'border-green-300 bg-green-900/20' : 'border-yellow-300 bg-yellow-900/20'}`}>
                  <div className="font-semibold mb-1">{name.toUpperCase()}</div>
                  <div className="text-sm">Estado: {ok ? 'OK' : 'Degradado'}</div>
                  <div className="text-sm">Latencia: {lat} ms</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="text-sm text-white/70 mb-2">Alertas activas</div>
            <div className="space-y-2">
              {(alerts || []).slice(0, 5).map((a, idx) => (
                <div key={idx} className="text-sm text-white bg-white/5 border border-white/10 rounded px-3 py-2">
                  {a.message || a.code} · {a.service || ''} · {a.severity || ''}
                </div>
              ))}
              {(!alerts || alerts.length === 0) && <div className="text-sm text-white/70">Sin alertas</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <SystemLatencyChart />
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 shadow-soft p-6 mb-6 text-white">
        <h3 className="text-lg font-bold mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <a className="btn-secondary" href={AdminAPI.reportUrl('/api/admin/reports/credentials.csv')} target="_blank" rel="noreferrer">Descargar CSV credenciales</a>
          <a className="btn-secondary" href={AdminAPI.reportUrl('/api/admin/reports/compliance.csv')} target="_blank" rel="noreferrer">Descargar CSV compliance</a>
          <a className="btn-secondary" href={AdminAPI.reportUrl('/api/admin/reports/backup-stats.pdf')} target="_blank" rel="noreferrer">Descargar PDF backup</a>
          <button className="px-4 py-2 rounded-lg bg-[#0066FF] text-white hover:bg-[#0057d6]" onClick={() => navigate('/admin/alerts')}>Configurar alertas</button>
          <button className="px-4 py-2 rounded-lg bg-[#0066FF] text-white hover:bg-[#0057d6]" onClick={() => navigate('/admin/credentials/bulk')}>Emisión masiva</button>
        </div>
        <div className="mt-4 text-sm text-white/70">Tiempo real: {isConnected ? 'Conectado' : 'Desconectado'} · Última actualización: {(healthRealtime?.timestamp || systemStatus?.timestamp || '').toString().replace('T',' ').replace('Z','')}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Generar API Key para instituciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="input-primary" placeholder="Nombre del partner" value={partnerName} onChange={(e)=>setPartnerName(e.target.value)} />
          <input className="input-primary" placeholder="ID de universidad (opcional)" value={universityId} onChange={(e)=>setUniversityId(e.target.value)} />
          <button className="btn-primary" onClick={async()=>{ try { setKeyError(''); setKeyLoading(true); const res = await AdminAPI.generatePartnerKey(partnerName, universityId || undefined); setKeyResult(res?.data || res); } catch (e) { setKeyError(e.message || 'Error'); setKeyResult(null); } finally { setKeyLoading(false); } }} disabled={keyLoading || !partnerName}>Generar</button>
        </div>
        {keyLoading && <div className="mt-3 text-sm text-gray-600">Generando…</div>}
        {keyError && <div className="mt-3 text-sm text-red-600">{keyError}</div>}
        {keyResult?.apiKey && (
          <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
            <div className="font-semibold mb-1">API Key creada</div>
            <div className="text-xs break-all">{keyResult.apiKey}</div>
            <div className="mt-2 text-xs text-green-700">Cópiala ahora, no se mostrará de nuevo.</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatsChart stats={stats} onSegmentClick={(key) => setActiveTab(key === 'approved' ? 'approved' : 'pending')} />
        <RecentInstitutions institutions={recent} />
      </div>
      <div className="mb-4 flex gap-2">
        <button className={`btn-primary ${activeTab==='pending'?'':'btn-secondary'}`} onClick={()=>setActiveTab('pending')}>📋 Pendientes</button>
        <button className={`btn-primary ${activeTab==='approved'?'':'btn-secondary'}`} onClick={()=>setActiveTab('approved')}>✅ Aprobadas</button>
        <button className={`btn-primary ${activeTab==='bookings'?'':'btn-secondary'}`} onClick={()=>setActiveTab('bookings')}>📅 Reservas</button>
        <button className={`btn-primary ${activeTab==='plans'?'':'btn-secondary'}`} onClick={()=>setActiveTab('plans')}>🧩 Planes</button>
        <button className={`btn-secondary`} onClick={loadDashboardStats}>🔄 Actualizar</button>
      </div>
      {activeTab==='pending' ? (
        <PendingInstitutions onActionComplete={loadDashboardStats}/>
      ) : activeTab==='approved' ? (
        <ApprovedInstitutions/>
      ) : activeTab==='bookings' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
          {bookingLoading ? (
            <div className="text-sm text-gray-500">Cargando reservas…</div>
          ) : bookingError ? (
            <div className="text-sm text-red-600">{bookingError}</div>
          ) : bookings.length === 0 ? (
            <div className="text-sm text-gray-600">Sin reservas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Institución</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Hora</th>
                    <th className="px-3 py-2">TZ</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t">
                      <td className="px-3 py-2">{b.name}</td>
                      <td className="px-3 py-2 font-mono">{b.email}</td>
                      <td className="px-3 py-2">{b.org}</td>
                      <td className="px-3 py-2">{b.date}</td>
                      <td className="px-3 py-2">{b.time}</td>
                      <td className="px-3 py-2">{b.tz}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">{b.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button className="btn-secondary" onClick={async()=>{ await AdminAPI.updateBookingStatus(b._id, 'confirmed'); loadBookings(); }}>Confirmar</button>
                          <button className="btn-secondary" onClick={async()=>{ await AdminAPI.updateBookingStatus(b._id, 'cancelled'); loadBookings(); }}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button className={`btn-primary ${planTab==='basic'?'':'btn-secondary'}`} onClick={()=>setPlanTab('basic')}>📊 Básico</button>
            <button className={`btn-primary ${planTab==='standard'?'':'btn-secondary'}`} onClick={()=>setPlanTab('standard')}>🚀 Profesional</button>
            <button className={`btn-primary ${planTab==='premium'?'':'btn-secondary'}`} onClick={()=>setPlanTab('premium')}>🏆 Premium</button>
            <button className={`btn-primary ${planTab==='enterprise'?'':'btn-secondary'}`} onClick={()=>setPlanTab('enterprise')}>🏢 Enterprise</button>
          </div>
          {planTab==='basic' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 DASHBOARD BÁSICO - Universidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold text-gray-800 mb-2">📈 Resumen</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Títulos emitidos: 85/100</li>
                    <li>• Costo promedio: $0.50 c/u</li>
                    <li>• Próxima factura: $155 (30 días)</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">🔗 Blockchain</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Hedera: 85 transacciones</li>
                    <li>• Estado: ✅ Todas confirmadas</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">⚠️ Alertas</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Límite: 15 títulos restantes</li>
                    <li>• Upgrade sugerido al llegar a 90</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {planTab==='standard' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 DASHBOARD PROFESIONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold text-gray-800 mb-2">📈 Resumen Detallado</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Títulos: 450/1000</li>
                    <li>• Costo Hedera: $0.09</li>
                    <li>• Costo XRP: $0.00045</li>
                    <li>• Ahorro vs solo Hedera: 45%</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">🔗 Blockchain Status</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Hedera: 450 tx ✅</li>
                    <li>• XRP: 30 anchors diarios ✅</li>
                    <li>• Sync: Perfecto</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">⚡ Features</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Batch processing activado</li>
                    <li>• Legal proof generado</li>
                    <li>• Backup automático</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {planTab==='premium' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 DASHBOARD PREMIUM INTELIGENTE</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold text-gray-800 mb-2">🧠 Sistema Inteligente</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Títulos hoy: 1,245</li>
                    <li>• Auto-distribución: Hedera 100 (8%)</li>
                    <li>• Auto-distribución: Algorand 1,145 (92%)</li>
                    <li>• Costo total: $1.1502</li>
                    <li>• Ahorro: 87% vs solo Hedera</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">🔗 Orchestration</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Algorand: 11 batches de 100 + 45 individuales</li>
                    <li>• Hedera: 100 títulos premium</li>
                    <li>• XRP: 1 anchor con hash batch</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-2">📊 Analytics</div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Proyección mensual: 25,000</li>
                    <li>• Costo estimado: $25.10</li>
                    <li>• Recomendación: Mantener plan</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {planTab==='enterprise' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏢 ENTERPRISE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Sharding por región/institución</li>
                    <li>• White-label dashboard</li>
                    <li>• API enterprise con SLA</li>
                    <li>• Integración SSO/SAML</li>
                    <li>• Soporte dedicado 24/7</li>
                    <li>• Auditoría y compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">CHECKLIST DE IMPLEMENTACIÓN</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div>
                <div className="font-semibold text-gray-800 mb-2">Plan ESENCIAL</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Cuenta Hedera Mainnet configurada</li>
                  <li>• Sistema de generación NFT HIP-412</li>
                  <li>• Wallet management para universidades</li>
                  <li>• API de emisión y verificación</li>
                  <li>• Dashboard con métricas básicas</li>
                  <li>• Sistema de facturación mensual</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-2">Plan PROFESIONAL</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Integración XRP Ledger + Hedera</li>
                  <li>• Sistema de anchors diarios</li>
                  <li>• Batch processing (hasta 250)</li>
                  <li>• Dashboard con comparativas de costos</li>
                  <li>• Migración automática de Esencial a Profesional</li>
                  <li>• Alertas de optimización</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-2">Plan ENTERPRISE</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Integración Algorand + Hedera + XRP</li>
                  <li>• Sistema inteligente de distribución</li>
                  <li>• Orquestador multi-blockchain</li>
                  <li>• Analytics predictivos</li>
                  <li>• Auto-optimización en tiempo real</li>
                  <li>• API avanzada con webhooks</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-2">Plan ENTERPRISE</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Sharding por región/institución</li>
                  <li>• White-label dashboard</li>
                  <li>• API enterprise con SLA</li>
                  <li>• Integración SSO/SAML</li>
                  <li>• Soporte dedicado 24/7</li>
                  <li>• Auditoría y compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
