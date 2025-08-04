import { useQuery } from 'react-query';
import axios from 'axios';
import { Layout } from '../../components/dashboard/Layout';
import { StatCard } from '../../components/dashboard/StatCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { TokenList } from '../../components/dashboard/TokenList';
import { BookOpen, CheckSquare, Users } from 'lucide-react';
import { withAuth } from '../../utils/withAuth';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const fetchUniversityData = async () => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    withCredentials: true, // Important for sending cookies
  });

  // The backend endpoints are already created. We just need to call them.
  const [statsRes, tokensRes] = await Promise.all([
    api.get('/university/statistics'),
    api.get('/university/tokens')
  ]);

  if (statsRes.status !== 200 || tokensRes.status !== 200) {
    throw new Error('Failed to fetch university data');
  }

  return { stats: statsRes.data.data, tokens: tokensRes.data.data };
};

function UniversityDashboard({ user }) { // user prop comes from withAuth HOC
  const { data, isLoading, error } = useQuery('universityDashboardData', fetchUniversityData);

  if (isLoading) {
    return <Layout><div className="text-center p-10 dark:text-white">Cargando panel de control...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center p-10 text-red-500">Error: {error.message}</div></Layout>;
  }

  const { stats, tokens } = data;

  return (
    <Layout>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Panel de {user.universityName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Bienvenido de nuevo. Aquí tienes un resumen de tu actividad.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Credenciales Emitidas"
            value={stats.statistics.totalCredentialsIssued}
            color="blue"
          />
          <StatCard
            icon={<CheckSquare className="w-6 h-6" />}
            title="Verificaciones (30 días)"
            value={stats.statistics.verificationsThisMonth}
            color="green"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Tokens Activos"
            value={stats.statistics.activeTokens}
            color="indigo"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TokenList tokens={tokens.tokens} />
          </div>
          <div>
            <RecentActivity activities={stats.statistics.recentActivity} />
          </div>
        </div>
    </Layout>
  );
}

// Protect the route so only authenticated users can access it
// and specify that only 'university' role is allowed.
export default withAuth(UniversityDashboard, ['university']);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}