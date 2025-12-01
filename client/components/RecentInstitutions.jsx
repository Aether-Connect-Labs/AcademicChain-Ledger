import React from 'react';

const RecentInstitutions = ({ institutions = [] }) => {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  const icon = (role) => role === 'pending_university' ? '⏳' : role === 'university' ? '✅' : role === 'student' ? '❌' : '❓';
  const color = (role) => role === 'pending_university' ? 'text-orange-600 bg-orange-100' : role === 'university' ? 'text-green-600 bg-green-100' : role === 'student' ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100';
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-lg font-semibold text-gray-900 mb-4">Instituciones Recientes</div>
      <div className="space-y-3">
        {institutions.length === 0 ? (
          <div className="text-gray-500">No hay instituciones recientes</div>
        ) : (
          institutions.map((u) => (
            <div key={u.id || u._id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name || u.universityName || u.email}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
                <div className="text-xs text-gray-500">{fmt(u.createdAt)}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${color(u.role)}`}>{icon(u.role)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentInstitutions;
