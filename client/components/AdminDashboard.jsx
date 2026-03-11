import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  FileText, 
  DollarSign, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Settings, 
  Key,
  RefreshCw,
  Search,
  Building,
  Calendar,
  Layers,
  ShieldAlert
} from 'lucide-react';
import PendingInstitutions from './PendingInstitutions';
import ApprovedInstitutions from './ApprovedInstitutions';
import StatsChart from './StatsChart';
import RecentInstitutions from './RecentInstitutions';
import AdminAPI from './services/adminAPI';
import { useWebSocket } from './useWebSocket';
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center max-w-md p-8 rounded-2xl bg-[#0d0d0d] border border-red-500/20">
          <div className="text-red-500 mb-4 flex justify-center">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Error de conexión</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={loadDashboardStats} 
            className="bg-blue-600/20 text-blue-400 border border-blue-500/50 px-6 py-3 rounded-lg hover:bg-blue-600/30 transition-colors font-medium"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] min-h-screen text-slate-100 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Toaster position="top-right" toastOptions={{ 
          style: { 
            background: '#0d0d0d', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)'
          } 
        }} />
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="text-blue-500" size={32} strokeWidth={1.5} />
              Panel de Administración
            </h1>
            <p className="text-slate-400 mt-1">Gestión centralizada del protocolo AcademicChain</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-mono border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {isConnected ? 'SOCKET: CONNECTED' : 'SOCKET: DISCONNECTED'}
            </div>
          </div>
        </header>

        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-4"
          >
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
              <AlertTriangle size={18} strokeWidth={1.5} />
              <span>Estado de Alertas ({alerts.length})</span>
            </div>
            <div className="space-y-1">
              {alerts.slice(0, 3).map((a, i) => (
                <div key={i} className="text-xs text-red-300/80 font-mono">
                  [{a.service || 'SYSTEM'}] {a.message || a.code}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Instituciones Activas', value: stats.approved, icon: Building, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Credenciales Totales', value: totalCreds, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Facturación Estimada', value: formatCurrency(totalCost), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Salud del Sistema', value: healthLabel, icon: Activity, color: healthLabel === 'Óptimo' ? 'text-green-400' : 'text-red-400', bg: healthLabel === 'Óptimo' ? 'bg-green-500/10' : 'bg-red-500/10' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 p-5 rounded-xl hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} strokeWidth={1.5} className="text-blue-400" />
                Top 5 Instituciones
              </h3>
              <button onClick={loadUsage} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={16} strokeWidth={1.5} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5">
                    <th className="px-3 py-3 font-medium">Institución</th>
                    <th className="px-3 py-3 font-medium">Creds</th>
                    <th className="px-3 py-3 font-medium">Verif (30d)</th>
                    <th className="px-3 py-3 font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topInstitutions.map((i) => (
                    <tr key={i.universityId} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-200">{i.universityName || i.email || i.universityId}</td>
                      <td className="px-3 py-3 text-slate-400">{i.credentials}</td>
                      <td className="px-3 py-3 text-slate-400">{i.verifications30d || 0}</td>
                      <td className="px-3 py-3 font-mono text-emerald-400">{formatCurrency(i.estimatedCost || 0)}</td>
                    </tr>
                  ))}
                  {topInstitutions.length === 0 && (
                    <tr><td className="px-3 py-4 text-center text-slate-500" colSpan={4}>Sin datos disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-purple-400" />
                Salud del Sistema
              </h3>
              <button onClick={loadSystemStatus} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceList.map((name) => {
                const d = services?.[name] || {};
                const ok = !!d.healthy;
                const lat = Number(d.latencyMs || 0);
                return (
                  <div key={name} className={`p-4 rounded-lg border ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-slate-200 uppercase text-xs tracking-wider">{name}</div>
                      {ok ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className={`text-xs ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{ok ? 'OPERATIVO' : 'DEGRADADO'}</div>
                      <div className="text-xs font-mono text-slate-500">{lat}ms</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="mb-8">
          <SystemLatencyChart />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Settings size={18} className="text-slate-400" />
            Acciones Rápidas
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'CSV Credenciales', url: '/api/admin/reports/credentials.csv' },
              { label: 'CSV Compliance', url: '/api/admin/reports/compliance.csv' },
              { label: 'PDF Backup', url: '/api/admin/reports/backup-stats.pdf' }
            ].map((action, i) => (
              <a 
                key={i}
                href={AdminAPI.reportUrl(action.url)} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <Download size={14} />
                {action.label}
              </a>
            ))}
            <button 
              onClick={() => navigate('/admin/alerts')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm transition-colors"
            >
              <ShieldAlert size={14} />
              Configurar Alertas
            </button>
            <button 
              onClick={() => navigate('/admin/credentials/bulk')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm transition-colors"
            >
              <Layers size={14} />
              Emisión Masiva
            </button>
          </div>
          <div className="mt-4 text-xs text-slate-600 font-mono">
             Última actualización: {(healthRealtime?.timestamp || systemStatus?.timestamp || '').toString().replace('T',' ').replace('Z','')}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Key size={18} className="text-amber-400" />
            Generar API Key para Instituciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Building className="absolute left-3 top-3 text-slate-500" size={16} />
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600" 
                placeholder="Nombre del partner" 
                value={partnerName} 
                onChange={(e)=>setPartnerName(e.target.value)} 
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={16} />
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600" 
                placeholder="ID de universidad (opcional)" 
                value={universityId} 
                onChange={(e)=>setUniversityId(e.target.value)} 
              />
            </div>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async()=>{ 
                try { 
                  setKeyError(''); 
                  setKeyLoading(true); 
                  const res = await AdminAPI.generatePartnerKey(partnerName, universityId || undefined); 
                  setKeyResult(res?.data || res); 
                } catch (e) { 
                  setKeyError(e.message || 'Error'); 
                  setKeyResult(null); 
                } finally { 
                  setKeyLoading(false); 
                } 
              }} 
              disabled={keyLoading || !partnerName}
            >
              {keyLoading ? 'Generando...' : 'Generar Key'}
            </button>
          </div>
          {keyError && <div className="mt-3 text-sm text-red-400">{keyError}</div>}
          {keyResult?.apiKey && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10"
            >
              <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                <CheckCircle size={14} /> API Key Creada
              </div>
              <div className="font-mono text-xs text-emerald-200/80 break-all bg-black/20 p-2 rounded border border-emerald-500/10">
                {keyResult.apiKey}
              </div>
              <div className="mt-2 text-xs text-emerald-500/70">Cópiala ahora, no se mostrará de nuevo.</div>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsChart stats={stats} onSegmentClick={(key) => setActiveTab(key === 'approved' ? 'approved' : 'pending')} />
          <RecentInstitutions institutions={recent} />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'pending', label: 'Pendientes', icon: Activity },
            { id: 'approved', label: 'Aprobadas', icon: CheckCircle },
            { id: 'bookings', label: 'Reservas', icon: Calendar },
            { id: 'plans', label: 'Planes', icon: Layers }
          ].map((tab) => (
            <button 
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`} 
              onClick={()=>setActiveTab(tab.id)}
            >
              <tab.icon size={16} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-auto" 
            onClick={loadDashboardStats}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {activeTab === 'pending' ? (
          <PendingInstitutions onActionComplete={loadDashboardStats}/>
        ) : activeTab === 'approved' ? (
          <ApprovedInstitutions/>
        ) : activeTab === 'bookings' ? (
          <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6">
            {bookingLoading ? (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Cargando reservas...
              </div>
            ) : bookingError ? (
              <div className="text-sm text-red-400">{bookingError}</div>
            ) : bookings.length === 0 ? (
              <div className="text-sm text-slate-500">No hay reservas pendientes</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      <th className="px-3 py-3 font-medium">Nombre</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Institución</th>
                      <th className="px-3 py-3 font-medium">Fecha</th>
                      <th className="px-3 py-3 font-medium">Estado</th>
                      <th className="px-3 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-3 text-slate-200">{b.name}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-400">{b.email}</td>
                        <td className="px-3 py-3 text-slate-300">{b.org}</td>
                        <td className="px-3 py-3 text-slate-300">
                          <div className="flex flex-col">
                            <span>{b.date}</span>
                            <span className="text-xs text-slate-500">{b.time} ({b.tz})</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            b.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button 
                              className="p-1 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                              title="Confirmar"
                              onClick={async()=>{ await AdminAPI.updateBookingStatus(b._id, 'confirmed'); loadBookings(); }}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title="Cancelar"
                              onClick={async()=>{ await AdminAPI.updateBookingStatus(b._id, 'cancelled'); loadBookings(); }}
                            >
                              <AlertTriangle size={16} />
                            </button>
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
              {['basic', 'standard', 'premium', 'enterprise'].map(plan => (
                <button 
                  key={plan}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    planTab === plan 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={()=>setPlanTab(plan)}
                >
                  {plan}
                </button>
              ))}
            </div>
            {planTab==='basic' && (
              <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📊 DASHBOARD BÁSICO - Universidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="font-semibold text-slate-200 mb-2">📈 Resumen</div>
                    <ul className="text-slate-400 space-y-1 text-sm">
                      <li>• Títulos emitidos: 45/50</li>
                      <li>• Costo promedio: $1.00 c/u</li>
                      <li>• Próxima factura: $50 (30 días)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
