import React, { useEffect, useState } from 'react';
import PendingInstitutions from './PendingInstitutions';
import ApprovedInstitutions from './ApprovedInstitutions';
import StatsChart from './StatsChart';
import RecentInstitutions from './RecentInstitutions';
import AdminAPI from './services/adminAPI';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [planTab, setPlanTab] = useState('basic');

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
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Administración</h1>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Instituciones</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Pendientes</div>
          <div className="text-2xl font-semibold">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Aprobadas</div>
          <div className="text-2xl font-semibold">{stats.approved}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Acciones Pendientes</div>
          <div className="text-2xl font-semibold">{stats.pending}</div>
        </div>
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
            <button className={`btn-primary ${planTab==='standard'?'':'btn-secondary'}`} onClick={()=>setPlanTab('standard')}>🚀 Estándar</button>
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
                    <li>• Costo promedio: $0.0002 c/u</li>
                    <li>• Próxima factura: $99 (30 días)</li>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 DASHBOARD ESTÁNDAR</h3>
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
                <div className="font-semibold text-gray-800 mb-2">Plan BÁSICO</div>
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
                <div className="font-semibold text-gray-800 mb-2">Plan ESTÁNDAR</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Integración XRP Ledger</li>
                  <li>• Sistema de anchors diarios</li>
                  <li>• Batch processing (hasta 1,000)</li>
                  <li>• Dashboard con comparativas de costos</li>
                  <li>• Migración automática de Básico a Estándar</li>
                  <li>• Alertas de optimización</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-2">Plan PREMIUM</div>
                <ul className="text-gray-700 space-y-1">
                  <li>• Integración Algorand</li>
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
