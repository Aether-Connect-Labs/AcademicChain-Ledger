import React from 'react';
import AdminSidebar from './AdminSidebar';
import TourBadge from './TourBadge.jsx';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-4">
            <TourBadge />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

