import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layouts/AdminLayout';
import { CredentialStats, RecentActivity } from '../../../components/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    issued: 0,
    pending: 0,
    revoked: 0
  });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data.stats);
      
      const activityRes = await fetch('/api/admin/activity');
      const activityData = await activityRes.json();
      setActivity(activityData);
    };
    
    fetchData();
    
    // WebSocket para actualización en tiempo real
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stats_update') {
        setStats(data.payload);
      }
      if (data.type === 'new_activity') {
        setActivity(prev => [data.payload, ...prev.slice(0, 9)]);
      }
    };
    
    return () => ws.close();
  }, []);

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CredentialStats 
          title="Total Emitidas" 
          value={stats.issued} 
          icon="certificate" 
        />
        <CredentialStats 
          title="Pendientes" 
          value={stats.pending} 
          icon="clock" 
          variant="warning"
        />
        <CredentialStats 
          title="Revocadas" 
          value={stats.revoked} 
          icon="ban" 
          variant="danger"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
        <RecentActivity data={activity} />
      </div>
    </AdminLayout>
  );
}