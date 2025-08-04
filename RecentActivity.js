import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, CheckSquare, UserPlus } from 'lucide-react';

const iconMap = {
  CREDENTIAL_MINTED: <BookOpen className="w-5 h-5 text-blue-500" />,
  CREDENTIAL_VERIFIED: <CheckSquare className="w-5 h-5 text-green-500" />,
  USER_LOGIN: <UserPlus className="w-5 h-5 text-indigo-500" />,
};

const messageMap = {
  CREDENTIAL_MINTED: (data) => `Nueva credencial emitida: ${data.degree}`,
  CREDENTIAL_VERIFIED: (data) => `Credencial verificada para token ${data.tokenId}`,
  USER_LOGIN: (data) => `Inicio de sesión desde ${data.ip || 'una nueva ubicación'}`,
};

export const RecentActivity = ({ activities }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Actividad Reciente</h3>
      <ul className="space-y-4">
        {activities.map((activity, index) => (
          <li key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {iconMap[activity.type] || <BookOpen className="w-5 h-5 text-gray-500" />}
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {messageMap[activity.type] ? messageMapactivity.type : `Evento: ${activity.type}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};