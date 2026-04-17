import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { PageLoader } from './components/LoadingSpinner';

// Lazy-loaded pages for better initial load performance
const Landing         = lazy(() => import('./pages/Landing'));
const Onboarding      = lazy(() => import('./pages/Onboarding'));
const PlanSelection   = lazy(() => import('./pages/PlanSelection'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const ClaimsHistory   = lazy(() => import('./pages/ClaimsHistory'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const PayoutSimulation = lazy(() => import('./pages/PayoutSimulation'));
const FraudDetection  = lazy(() => import('./pages/FraudDetection'));

function RequireWorkerAuth() {
  const { worker, isReady } = useAuth();

  if (!isReady) return <PageLoader />;
  if (!worker)  return <Navigate to="/onboard" replace />;
  return <Outlet />;
}

function RequireAdminAuth() {
  const { isAdmin, isReady } = useAuth();

  if (!isReady) return <PageLoader />;
  // If not admin, redirect back to the admin login page
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"      element={<Landing />} />
              <Route path="/onboard" element={<Onboarding />} />
              <Route path="/plans"   element={<PlanSelection />} />
              <Route path="/admin"   element={<AdminDashboard />} />

              {/* Worker-authenticated routes */}
              <Route element={<RequireWorkerAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/claims"    element={<ClaimsHistory />} />
                <Route path="/simulate"  element={<PayoutSimulation />} />
              </Route>

              {/* Admin-authenticated routes */}
              <Route element={<RequireAdminAuth />}>
                <Route path="/admin/fraud" element={<FraudDetection />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
