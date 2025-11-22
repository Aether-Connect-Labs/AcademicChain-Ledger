import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import InstitutionDashboard from './components/InstitutionDashboard';
import ComenzarGratisPage from './components/ComenzarGratisPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/register" element={<Layout><LoginPage mode="register" /></Layout>} />
      <Route path="/institution/login" element={<Layout><LoginPage userType="institution" /></Layout>} />
      <Route path="/institution/register" element={<Layout><LoginPage userType="institution" mode="register" /></Layout>} />
      <Route path="/students/login" element={<Layout><LoginPage userType="student" /></Layout>} />
      <Route path="/students/register" element={<Layout><LoginPage userType="student" mode="register" /></Layout>} />
      <Route path="/auth/callback" element={<Layout><AuthCallback /></Layout>} />
      <Route path="/comenzar-gratis" element={<Layout><ComenzarGratisPage /></Layout>} />

      {/* Rutas Protegidas */}
      <Route
        path="/institution/dashboard"
        element={
          <ProtectedRoute requiredRoles={['institution']}>
            <Layout><InstitutionDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/portal"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout><StudentPortal /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;