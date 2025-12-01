import React from 'react';
import { useAuth } from './useAuth';
import AdminDashboard from './AdminDashboard';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b p-4 flex items-center justify-between">
        <div className="font-semibold">🎓 AcademicChain Admin</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{user?.name}</span>
          <button className="btn-secondary" onClick={logout}>🚪 Cerrar Sesión</button>
        </div>
      </nav>
      <main>
        <AdminDashboard />
      </main>
    </div>
  );
};

export default AdminPanel;

