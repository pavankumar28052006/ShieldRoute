import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import PlanSelection from './pages/PlanSelection';
import Dashboard from './pages/Dashboard';
import ClaimsHistory from './pages/ClaimsHistory';
import AdminDashboard from './pages/AdminDashboard';
import PayoutSimulation from './pages/PayoutSimulation';
import FraudDetection from './pages/FraudDetection';

function RequireWorkerAuth() {
  const { worker, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!worker) {
    return <Navigate to="/onboard" replace />;
  }

  return <Outlet />;
}

function RequireAdminAuth() {
  const { isAdmin, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboard" element={<Onboarding />} />
          <Route path="/plans" element={<PlanSelection />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route element={<RequireWorkerAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsHistory />} />
            <Route path="/simulate" element={<PayoutSimulation />} />
          </Route>

          <Route element={<RequireAdminAuth />}>
            <Route path="/admin/fraud" element={<FraudDetection />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
