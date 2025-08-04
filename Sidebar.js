import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap, LayoutDashboard, LogOut, BookOpen, Users, FileText } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/credentials', label: 'Credenciales', icon: BookOpen },
  { href: '/dashboard/students', label: 'Estudiantes', icon: Users },
  { href: '/dashboard/reports', label: 'Reportes', icon: FileText },
];

export const Sidebar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      // Limpiar cualquier estado de autenticación del cliente
      // Por ejemplo, con react-query: queryClient.clear();
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
        <GraduationCap className="w-8 h-8 text-blue-600 dark:text-cyan-400" />
        <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">AcademicChain</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} legacyBehavior>
            <a
              className={clsx(
                'flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg transition-colors duration-200',
                router.pathname === item.href
                  ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="ml-4 font-medium">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center mt-4 px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-4 font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};