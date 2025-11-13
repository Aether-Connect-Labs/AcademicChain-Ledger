import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './useAuth';

// Importa tus páginas/componentes
import HomePage from './components/HomePage';
import BatchIssuancePage from './components/BatchIssuancePage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas con Layout General */}
        <Route element={<Layout.Landing><Outlet /></Layout.Landing>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<div className="p-8"><h1 className="text-2xl font-bold">Features</h1></div>} />
        </Route>

        {/* Rutas de Autenticación */}
        <Route element={<Layout.Auth><Outlet /></Layout.Auth>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/institutions/login" element={<LoginPage userType="institution" />} />
          <Route path="/students/login" element={<LoginPage userType="student" />} />
        </Route>

        {/* Rutas de Administración Protegidas */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Layout.Admin>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </Layout.Admin>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="credentials/bulk" element={<BatchIssuancePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;