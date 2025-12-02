import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import InstitutionDashboard from './components/InstitutionDashboard';
import StudentPortal from './components/StudentPortal';
import ComenzarGratisPage from './components/ComenzarGratisPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import PendingInstitutions from './components/PendingInstitutions';
import ApprovedInstitutions from './components/ApprovedInstitutions';
import AdminPanel from './components/AdminPanel';
import BatchIssuancePage from './components/BatchIssuancePage';
import CredentialVerifier from './components/credentials/CredentialVerifier';
import Welcome from './components/Welcome';
import CreateDegreePage from './components/CreateDegreePage';
import CreateCertificatePage from './components/CreateCertificatePage';
import CreateDiplomaPage from './components/CreateDiplomaPage';
import VerifyCredentialPage from './components/VerifyCredentialPage';
import InstitutionsPage from './components/InstitutionsPage';
import ForgotPassword from './components/ForgotPassword';
import CreateCredentialsPage from './components/CreateCredentialsPage';
import BatchIssuance from './components/BatchIssuance';
import DeveloperPortal from './components/DeveloperPortal';
import ApiDocsLanding from './components/ApiDocsLanding';
import PendingApproval from './components/PendingApproval';

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
      <Route path="/welcome" element={<Layout><Welcome /></Layout>} />
      <Route path="/verify" element={<Layout><CredentialVerifier /></Layout>} />
      <Route path="/verificar" element={<Layout><VerifyCredentialPage /></Layout>} />
      <Route path="/instituciones" element={<Layout><InstitutionsPage /></Layout>} />
      <Route path="/developers" element={<Layout><DeveloperPortal /></Layout>} />
      <Route path="/developers/docs" element={<Layout><ApiDocsLanding /></Layout>} />
      {/* Rutas demo eliminadas para entorno operacional */}
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />

      {/* Rutas Protegidas */}
      <Route
        path="/institution/pending"
        element={
          <ProtectedRoute requiredRoles={["pending_university"]}>
            <Layout><PendingApproval /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/dashboard"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><InstitutionDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/crear"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><CreateCredentialsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/emitir/titulo"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><CreateDegreePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/emitir/certificado"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><CreateCertificatePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/emitir/diploma"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><CreateDiplomaPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/emitir/masivo"
        element={
          <ProtectedRoute requiredRoles={['university','institution','admin']}>
            <Layout><BatchIssuance /></Layout>
          </ProtectedRoute>
        }
      />
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
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['admin','institution','university']}>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/panel"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><PendingInstitutions /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/institutions/approved"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><ApprovedInstitutions /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/credentials/bulk"
        element={
          <ProtectedRoute requiredRoles={['admin','institution','university']}>
            <AdminLayout><BatchIssuancePage /></AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
