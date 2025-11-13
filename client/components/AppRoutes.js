import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';

// Importa tus páginas/componentes
import HomePage from './pages/HomePage';
import BatchIssuancePage from './pages/admin/BatchIssuancePage';
import FeaturesPage from './pages/FeaturesPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas con Layout General */}
        <Route element={<Layout.Landing />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          {/* ... otras rutas públicas */}
        </Route>

        {/* Rutas de Autenticación sin Layout */}
        <Route element={<Layout.Auth />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/institutions/login" element={<LoginPage userType="institution" />} />
          <Route path="/students/login" element={<LoginPage userType="student" />} />
        </Route>

        {/* Rutas de Administración Protegidas */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="credentials/bulk" element={<BatchIssuancePage />} />
          {/* ... otras rutas de admin anidadas */}
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;