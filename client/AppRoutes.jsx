import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import InstitutionDashboard from './components/InstitutionDashboard';
import ComenzarGratisPage from './components/ComenzarGratisPage';

const AppRoutes = () =\u003e {
  return (
    \u003cRoutes\u003e
      \u003cRoute path="/" element={\u003cLayout\u003e\u003cHomePage /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/login" element={\u003cLayout\u003e\u003cLoginPage /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/register" element={\u003cLayout\u003e\u003cLoginPage mode="register" /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/institution/login" element={\u003cLayout\u003e\u003cLoginPage userType="institution" /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/institution/register" element={\u003cLayout\u003e\u003cLoginPage userType="institution" mode="register" /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/students/login" element={\u003cLayout\u003e\u003cLoginPage userType="student" /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/students/register" element={\u003cLayout\u003e\u003cLoginPage userType="student" mode="register" /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/auth/callback" element={\u003cLayout\u003e\u003cAuthCallback /\u003e\u003c/Layout\u003e} /\u003e
      \u003cRoute path="/comenzar-gratis" element={\u003cLayout\u003e\u003cComenzarGratisPage /\u003e\u003c/Layout\u003e} /\u003e

      {/* Rutas Protegidas */}
      \u003cRoute
        path="/institution/dashboard"
        element={
          \u003cProtectedRoute requiredRoles={['institution']}\u003e
            \u003cLayout\u003e\u003cInstitutionDashboard /\u003e\u003c/Layout\u003e
          \u003c/ProtectedRoute\u003e
        }
      /\u003e
      \u003cRoute
        path="/student/portal"
        element={
          \u003cProtectedRoute requiredRoles={['student']}\u003e
            \u003cLayout\u003e\u003cStudentPortal /\u003e\u003c/Layout\u003e
          \u003c/ProtectedRoute\u003e
        }
      /\u003e
    \u003c/Routes\u003e
  );
};

export default AppRoutes;








