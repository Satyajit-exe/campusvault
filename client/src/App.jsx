import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MaintenancePage from './pages/MaintenancePage';
import StudentDashboard from './pages/StudentDashboard';
import GlobalSearchPage from './pages/GlobalSearchPage';
import SubjectPage from './pages/SubjectPage';
import SubjectPyqPage from './pages/SubjectPyqPage';
import ExamModePage from './pages/ExamModePage';
import ResourceViewerPage from './pages/ResourceViewerPage';
import SavedMaterialsPage from './pages/SavedMaterialsPage';
import StudyProgressPage from './pages/StudyProgressPage';
import ContributePage from './pages/ContributePage';
import MyContributionsPage from './pages/MyContributionsPage';
import RequestMaterialPage from './pages/RequestMaterialPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContributions from './pages/admin/AdminContributions';
import AdminResources from './pages/admin/AdminResources';
import AdminHierarchy from './pages/admin/AdminHierarchy';
import AdminRequests from './pages/admin/AdminRequests';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    async function checkSystem() {
      try {
        const res = await api.getSystemStatus();
        if (res && res.maintenance) {
          setMaintenance(true);
        } else {
          setMaintenance(false);
        }
      } catch (err) {
        // Backend offline or restarting
      }
    }
    checkSystem();
  }, []);

  const handleToggleMaintenance = async () => {
    try {
      const res = await api.setMaintenanceMode({ enabled: !maintenance });
      setMaintenance(Boolean(res?.maintenance?.enabled));
    } catch (err) {
      alert(err.message || 'Failed to update maintenance mode');
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isViewerRoute = location.pathname.includes('/view') || location.pathname.startsWith('/viewer');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/forgot-password';

  // If maintenance mode is active and current user is NOT an admin (and hasn't bypassed via login):
  if (maintenance && !isAdmin && !bypassed && !isAuthRoute) {
    return <MaintenancePage onBypass={() => setBypassed(true)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* Admin Maintenance Alert Banner */}
      {maintenance && isAdmin && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-semibold flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⚠️</span>
            <span>Maintenance Mode is ACTIVE. Non-admin students currently see the maintenance screen.</span>
          </div>
          <button
            onClick={handleToggleMaintenance}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Turn Off Maintenance Mode
          </button>
        </div>
      )}

      {/* Hide regular Navbar on Admin routes or when full immersion in Viewer is active */}
      {!isAdminRoute && !isViewerRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Student Vault Routes - Must register/login to access */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <GlobalSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:slug"
            element={
              <ProtectedRoute>
                <SubjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:slug/pyqs"
            element={
              <ProtectedRoute>
                <SubjectPyqPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:slug/exam-mode"
            element={
              <ProtectedRoute>
                <ExamModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/:slug/view"
            element={
              <ProtectedRoute>
                <ResourceViewerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer/:slug"
            element={
              <ProtectedRoute>
                <ResourceViewerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <RequestMaterialPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedMaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <StudyProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contribute"
            element={
              <ProtectedRoute>
                <ContributePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-contributions"
            element={
              <ProtectedRoute>
                <MyContributionsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminContributions />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="hierarchy" element={<AdminHierarchy />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </div>

      {/* Hide regular Footer on Admin and Viewer routes */}
      {!isAdminRoute && !isViewerRoute && <Footer />}
    </div>
  );
}
