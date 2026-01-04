import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import InstitutionDashboard from './components/InstitutionDashboard';
import StudentPortal from './components/StudentPortal';
import EnhancedInstitutionDashboard from './components/EnhancedInstitutionDashboard';
import EnhancedStudentPortal from './components/EnhancedStudentPortal';
import ComenzarGratisPage from './components/ComenzarGratisPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminUsage from './components/AdminUsage';
import AdminAlerts from './components/AdminAlerts';
import AdminReports from './components/AdminReports';
import RateDashboard from './components/RateDashboard';
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
import PricingPage from './components/PricingPage';
import PendingApproval from './components/PendingApproval';
import DemoScheduler from './components/DemoScheduler';
import Profile from './components/Profile';
import BlockchainStatus from './components/BlockchainStatus';
import CredentialEvidence from './components/credentials/CredentialEvidence';
import InteractiveTour from './components/InteractiveTour.jsx';
import DashboardRedirect from './components/DashboardRedirect';
import AdminRevocationPanel from './components/admin/AdminRevocationPanel.jsx';

const AppRoutes = () => {
  return (
    <>
    <InteractiveTour />
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
      <Route path="/institutions" element={<Layout><InstitutionsPage /></Layout>} />
      <Route path="/developers" element={<Layout><DeveloperPortal /></Layout>} />
  <Route path="/developers/docs" element={<Layout><ApiDocsLanding /></Layout>} />
      <Route path="/precios" element={<Layout><PricingPage /></Layout>} />
      <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
      <Route path="/agenda" element={<Layout><DemoScheduler /></Layout>} />
      <Route path="/schedule" element={<Layout><DemoScheduler /></Layout>} />
      <Route path="/docs" element={<Layout><ApiDocsLanding /></Layout>} />
      <Route path="/verify" element={<Layout><CredentialVerifier /></Layout>} />
      <Route path="/status" element={<Layout><BlockchainStatus /></Layout>} />
      <Route path="/credential/:tokenId/:serialNumber/evidence" element={<Layout><CredentialEvidence /></Layout>} />
      <Route path="/dashboard" element={<Layout><DashboardRedirect /></Layout>} />
      {/* Rutas públicas de demo */}
      <Route path="/demo/institution" element={<Layout><EnhancedInstitutionDashboard demo={true} /></Layout>} />
      <Route path="/demo/student" element={<Layout><EnhancedStudentPortal demo={true} /></Layout>} />
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
            <Layout><EnhancedInstitutionDashboard /></Layout>
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
        path="/student/portal"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout><EnhancedStudentPortal /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRoles={['institution','university','admin','student']}>
            <Layout><Profile /></Layout>
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
        path="/admin/usage"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><AdminUsage /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><AdminAlerts /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><AdminReports /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rate"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><RateDashboard /></AdminLayout>
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
      <Route
        path="/admin/credentials/revoke"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout><AdminRevocationPanel /></AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  );
};

export default AppRoutes;
