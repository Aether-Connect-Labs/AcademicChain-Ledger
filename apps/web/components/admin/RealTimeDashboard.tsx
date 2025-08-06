import { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import io from 'socket.io-client';

Chart.register(...registerables);

const socket = io(process.env.NEXT_PUBLIC_WS_URL!);

export default function RealTimeDashboard() {
  const [stats, setStats] = useState({
    credentialsIssued: 0,
    credentialsVerified: 0,
    institutionsActive: 0,
    transactions: [],
    degrees: 0,
    diplomas: 0,
    certificates: 0,
    dailyIssued: [],
    dailyVerified: []
  });

  useEffect(() => {
    // Escuchar actualizaciones en tiempo real
    socket.on('stats_update', (data) => {
      setStats(prev => ({
        ...prev,
        ...data
      }));
    });

    // Cargar datos iniciales
    const loadInitialData = async () => {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    };

    loadInitialData();

    return () => {
      socket.off('stats_update');
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Emisión de Credenciales</h3>
        <Line
          data={{
            labels: stats.transactions.map(t => new Date(t.timestamp).toLocaleTimeString()),
            datasets: [{
              label: 'Credenciales emitidas',
              data: stats.transactions.map(t => t.count),
              borderColor: 'rgb(59, 130, 246)',
              tension: 0.1
            }]
          }}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Distribución por Tipo</h3>
        <Pie
          data={{
            labels: ['Títulos', 'Diplomas', 'Certificados'],
            datasets: [{
              data: [stats.degrees, stats.diplomas, stats.certificates],
              backgroundColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)'
              ]
            }]
          }}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <Bar
          data={{
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
              {
                label: 'Emisiones',
                data: stats.dailyIssued,
                backgroundColor: 'rgba(59, 130, 246, 0.6)'
              },
              {
                label: 'Verificaciones',
                data: stats.dailyVerified,
                backgroundColor: 'rgba(16, 185, 129, 0.6)'
              }
            ]
          }}
          options={{
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>
    </div>
  );
}