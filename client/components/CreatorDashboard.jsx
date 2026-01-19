import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { issuanceService } from './services/issuanceService';
import { toGateway } from './utils/ipfsUtils';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

import CreatorIssuance from './CreatorIssuance';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalIssued: 0,
    totalStudents: 0,
    thisMonth: 0,
    successRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [creatorProfile, setCreatorProfile] = useState({
    name: '',
    did: '',
    brand: '',
    apiKey: ''
  });

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load creator credentials
      const res = await issuanceService.getCreatorCredentials();
      if (res.success) {
        setCredentials(res.data);
        calculateStats(res.data);
        setRecentActivity(res.data.slice(0, 5));
      }

      // Load creator profile
      const profileRes = await issuanceService.getCreatorProfile();
      if (profileRes.success) {
        setCreatorProfile(profileRes.data);
      }
    } catch (err) {
      setError('Error al cargar datos del creador');
      console.error('Creator dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (credentials) => {
    const totalIssued = credentials.length;
    const uniqueStudents = new Set(credentials.map(c => c.studentId)).size;
    const thisMonth = credentials.filter(c => {
      const issuedDate = new Date(c.issuedAt);
      const now = new Date();
      return issuedDate.getMonth() === now.getMonth() && issuedDate.getFullYear() === now.getFullYear();
    }).length;
    const successRate = totalIssued > 0 ? 100 : 0;

    setStats({
      totalIssued,
      totalStudents: uniqueStudents,
      thisMonth,
      successRate
    });
  };

  const monthlyData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Certificados Emitidos',
      data: [12, 19, 8, 15, 22, 18],
      backgroundColor: '#FFD700',
      borderColor: '#FFA500',
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const typeDistribution = {
    labels: ['Cursos', 'Talleres', 'Bootcamps', 'Mentorías'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'],
      borderColor: '#000',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#FFD700',
          font: { size: 14, weight: 'bold' }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#FFD700' },
        grid: { color: '#333' }
      },
      y: {
        ticks: { color: '#FFD700' },
        grid: { color: '#333' }
      }
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Premium Dark Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-yellow-500">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                Portal de Creadores
              </h1>
              <p className="text-gray-300 text-lg">
                Tu plataforma de certificación digital exclusiva
              </p>
            </div>
            <div className="text-right">
              <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
                MENTOR VERIFICADO
              </div>
              <p className="text-yellow-400 mt-2 font-mono text-sm">
                {creatorProfile.did || 'DID: No asignado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <div className="text-yellow-400 text-3xl font-bold mb-2">
              {stats.totalIssued}
            </div>
            <div className="text-gray-300">Certificados Emitidos</div>
            <div className="text-yellow-500 text-sm mt-2">
              📜 Vidas certificadas
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <div className="text-yellow-400 text-3xl font-bold mb-2">
              {stats.totalStudents}
            </div>
            <div className="text-gray-300">Estudiantes Únicos</div>
            <div className="text-yellow-500 text-sm mt-2">
              👥 Alcance de impacto
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <div className="text-yellow-400 text-3xl font-bold mb-2">
              {stats.thisMonth}
            </div>
            <div className="text-gray-300">Este Mes</div>
            <div className="text-yellow-500 text-sm mt-2">
              📈 Crecimiento actual
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <div className="text-yellow-400 text-3xl font-bold mb-2">
              {stats.successRate}%
            </div>
            <div className="text-gray-300">Tasa de Éxito</div>
            <div className="text-yellow-500 text-sm mt-2">
              ✅ Calidad garantizada
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              📊 Emisiones Mensuales
            </h3>
            <div className="h-64">
              <Bar data={monthlyData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              🎯 Distribución por Tipo
            </h3>
            <div className="h-64">
              <Doughnut data={typeDistribution} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#FFD700',
                      font: { size: 12, weight: 'bold' }
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            🔌 Integración y API
          </h3>
          <p className="text-gray-400 mb-4">
            Utiliza tu API Key para conectar tus plataformas (Hotmart, Kajabi, etc.) y emitir certificados automáticamente.
          </p>
          <div className="flex items-center space-x-4 bg-black p-4 rounded-lg">
            <input
              type="text"
              readOnly
              value={creatorProfile.apiKey || 'No disponible'}
              className="flex-grow bg-transparent text-yellow-400 font-mono border-none p-0 focus:ring-0"
            />
            <button 
              onClick={() => navigator.clipboard.writeText(creatorProfile.apiKey)}
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              Copiar
            </button>
            <button className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 transition-colors">
              Regenerar
            </button>
          </div>
        </div>

        <div className="mb-8">
          <CreatorIssuance />
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            🚀 Actividad Reciente
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Cargando actividad...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700 hover:border-yellow-400 transition-all duration-300">
                      <div>
                        <div className="text-yellow-400 font-semibold">
                          {activity.studentName}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {activity.credentialType} • {new Date(activity.issuedAt).toLocaleDateString()}
                        </div>
                        {activity.metadata?.mentorVerified && (
                          <div className="text-xs text-yellow-500 mt-1 font-bold">
                            Emitido por: {activity.issuerBrand || 'Creador Verificado'}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-mono text-xs">
                          ✓ Verificado en blockchain
                        </div>
                        {activity.metadata?.mentorVerified && (
                          <div className="mt-1">
                            <span className="inline-block bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                              MENTOR VERIFICADO
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No hay actividad reciente
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">🎓</div>
            <h4 className="text-lg font-bold mb-2">Emitir Certificado</h4>
            <p className="text-yellow-100 text-sm mb-4">
              Crea un nuevo certificado para tu estudiante
            </p>
            <button className="bg-black text-yellow-400 px-6 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors">
              Crear Ahora
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">⚙️</div>
            <h4 className="text-lg font-bold mb-2">Configuración</h4>
            <p className="text-gray-300 text-sm mb-4">
              Gestiona tu perfil y API Key
            </p>
            <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
              Configurar
            </button>
          </div>

          <div className="bg-gradient-to-br from-yellow-700 to-yellow-900 rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">📊</div>
            <h4 className="text-lg font-bold mb-2">Analytics</h4>
            <p className="text-yellow-100 text-sm mb-4">
              Análisis detallado de tu impacto
            </p>
            <button className="bg-black text-yellow-400 px-6 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors">
              Ver Más
            </button>
          </div>
        </div>

        {/* API Key Section */}
        <div className="mt-8 bg-gray-900 border border-yellow-500 rounded-xl p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            🔑 Tu API Key de Creador
          </h3>
          <div className="bg-black p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <code className="text-yellow-400 font-mono text-sm break-all">
                {creatorProfile.apiKey || 'No generada'}
              </code>
              <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors ml-4">
                Copiar
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Usa esta clave para integrar tu academia con plataformas externas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;