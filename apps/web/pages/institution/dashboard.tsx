import { useState, useEffect } from 'react';
// Assuming these components are defined elsewhere
const InstitutionLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const CredentialIssuanceChart = () => <div className="h-64 bg-gray-100 flex items-center justify-center">Credential Issuance Chart</div>;
const VerificationStats = () => <div className="h-64 bg-gray-100 flex items-center justify-center">Verification Stats</div>;
const RecentActivity = ({ data }: { data: any[] }) => <div className="h-64 bg-gray-100 flex items-center justify-center">Recent Activity: {JSON.stringify(data)}</div>;

export default function InstitutionDashboard() {
  const [stats, setStats] = useState({
    issued: 0,
    revoked: 0,
    pending: 0,
    verificationRequests: 0
  });
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/institution/stats'),
          fetch('/api/institution/activity')
        ]);
        
        setStats(await statsRes.json());
        setActivity(await activityRes.json());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // WebSocket para actualizaciones en tiempo real
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'institution_update') {
        setStats(prev => ({ ...prev, ...data.payload }));
        setActivity(prev => [data.payload.activity, ...prev.slice(0, 9)]);
      }
    };

    return () => ws.close();
  }, []);

  if (isLoading) {
    return (
      <InstitutionLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </InstitutionLayout>
    );
  }

  return (
    <InstitutionLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Emitidas</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.issued}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Revocadas</h3>
          <p className="text-3xl font-bold text-red-600">{stats.revoked}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Verificaciones</h3>
          <p className="text-3xl font-bold text-green-600">{stats.verificationRequests}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Emisión por Mes</h3>
          <CredentialIssuanceChart />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Solicitudes de Verificación</h3>
          <VerificationStats />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <RecentActivity data={activity} />
      </div>
    </InstitutionLayout>
  );
}