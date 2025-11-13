import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Credenciales</h2>
          <p className="text-gray-600">Gestión de credenciales académicas</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Instituciones</h2>
          <p className="text-gray-600">Administrar instituciones</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
          <p className="text-gray-600">Gestión de usuarios</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

