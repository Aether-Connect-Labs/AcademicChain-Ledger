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
        <button className={`btn-secondary`} onClick={loadDashboardStats}>🔄 Actualizar</button>
      </div>
      {activeTab==='pending' ? (
        <PendingInstitutions onActionComplete={loadDashboardStats}/>
      ) : activeTab==='approved' ? (
        <ApprovedInstitutions/>
      ) : (
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
      )}
    </div>
  );
};

export default AdminDashboard;
