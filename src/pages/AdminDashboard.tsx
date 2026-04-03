import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  LogOut,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RecentClaim {
  id: string;
  trigger_name: string;
  fraud_score: number;
  amount: number;
  status: string;
  workers?: {
    name?: string;
    zone?: string;
  };
}

interface AdminStats {
  totalWorkers: number;
  activePolicies: number;
  weeklyPayouts: number;
  lossRatio: number;
}

const weeklyPayoutsData = [
  { week: 'Week 1', amount: 38200 },
  { week: 'Week 2', amount: 42500 },
  { week: 'Week 3', amount: 45800 },
  { week: 'Week 4', amount: 51200 },
  { week: 'Week 5', amount: 48900 },
  { week: 'Week 6', amount: 52300 },
  { week: 'Week 7', amount: 47100 },
  { week: 'Week 8', amount: 48230 },
];

const enrollmentData = [
  { week: 'Week 1', workers: 245 },
  { week: 'Week 2', workers: 389 },
  { week: 'Week 3', workers: 512 },
  { week: 'Week 4', workers: 678 },
  { week: 'Week 5', workers: 789 },
  { week: 'Week 6', workers: 891 },
  { week: 'Week 7', workers: 1023 },
  { week: 'Week 8', workers: 1156 },
  { week: 'Week 9', workers: 1247 },
];

const zoneData = [
  { zone: 'Koramangala', risk: 'High', activeWorkers: 287, claimsThisWeek: 34, exposure: 89400 },
  { zone: 'Banjara Hills', risk: 'Medium', activeWorkers: 213, claimsThisWeek: 18, exposure: 52100 },
  { zone: 'Andheri', risk: 'High', activeWorkers: 198, claimsThisWeek: 28, exposure: 71200 },
  { zone: 'Connaught Place', risk: 'Low', activeWorkers: 156, claimsThisWeek: 12, exposure: 38900 },
  { zone: 'T Nagar', risk: 'Medium', activeWorkers: 129, claimsThisWeek: 15, exposure: 43600 },
];

const fraudEvents = [
  { id: 'AC2847', score: 12, gps: 0, activity: 5, anomaly: 7, action: 'Approved' },
  { id: 'AC5612', score: 28, gps: 8, activity: 12, anomaly: 8, action: 'Approved' },
  { id: 'AC7834', score: 45, gps: 15, activity: 18, anomaly: 12, action: 'Manual Review' },
  { id: 'AC9201', score: 72, gps: 28, activity: 25, anomaly: 19, action: 'Rejected' },
  { id: 'AC3456', score: 19, gps: 5, activity: 8, anomaly: 6, action: 'Approved' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, setIsAdmin } = useAuth();
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  const [showLogin, setShowLogin] = useState(!isAdmin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadRecentClaims();
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      // Count total workers
      const { count: workerCount } = await supabase
        .from('workers')
        .select('id', { count: 'exact', head: true });

      // Count active policies
      const { count: policyCount } = await supabase
        .from('policies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Sum payouts this week
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: weekClaims } = await supabase
        .from('claims')
        .select('amount, status')
        .gte('created_at', weekStart);

      const weeklyPayouts = (weekClaims ?? [])
        .filter((c) => c.status === 'approved')
        .reduce((sum, c) => sum + c.amount, 0);

      // Premium collected this week
      const { data: weekPolicies } = await supabase
        .from('policies')
        .select('final_premium')
        .gte('created_at', weekStart);

      const weeklyPremium = (weekPolicies ?? []).reduce(
        (sum, p) => sum + p.final_premium,
        0
      );

      const lossRatio = weeklyPremium > 0
        ? Math.round((weeklyPayouts / weeklyPremium) * 100)
        : 0;

      setStats({
        totalWorkers: workerCount ?? 0,
        activePolicies: policyCount ?? 0,
        weeklyPayouts,
        lossRatio,
      });
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadRecentClaims = async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('*, workers(name, zone)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      setRecentClaims([]);
      return;
    }

    setRecentClaims(data || []);
  };

  /** Update claim status to approved or rejected in Supabase */
  const handleClaimAction = async (claimId: string, action: 'approved' | 'rejected') => {
    setActionLoading(claimId + action);
    const { error } = await supabase
      .from('claims')
      .update({ status: action })
      .eq('id', claimId);

    if (!error) {
      setRecentClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: action } : c))
      );
    }
    setActionLoading(null);
  };

  const handleLogin = () => {
    if (!adminUsername || !adminPassword) {
      setError('Admin credentials not configured. Set VITE_ADMIN_USERNAME and VITE_ADMIN_PASSWORD.');
      return;
    }

    if (username === adminUsername && password === adminPassword) {
      setIsAdmin(true);
      setShowLogin(false);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-10 h-10 text-emerald-500" />
              <span className="text-3xl font-bold text-white">ShieldRoute</span>
            </div>
            <p className="text-slate-400">Admin Portal</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Admin Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="admin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleLogin}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-500 bg-red-500/10';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'Low': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getFraudColor = (score: number) => {
    if (score < 30) return 'bg-emerald-500/10';
    if (score < 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getFraudTextColor = (score: number) => {
    if (score < 30) return 'text-emerald-500';
    if (score < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">ShieldRoute Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/fraud')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Fraud Center
            </button>
            <button
              onClick={() => {
                setIsAdmin(false);
                navigate('/');
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Insurance Analytics Dashboard
          </h1>
          <p className="text-slate-400">Monitor and manage the ShieldRoute platform</p>
        </div>

        {/* KPI Cards — real DB data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              {statsLoading && <span className="text-xs text-slate-600 animate-pulse">loading...</span>}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '—' : (stats?.totalWorkers ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Total Enrolled Workers</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '—' : (stats?.activePolicies ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Active Policies This Week</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '—' : `₹${(stats?.weeklyPayouts ?? 0).toLocaleString('en-IN')}`}
            </div>
            <div className="text-sm text-slate-400">Total Payouts This Week</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '—' : `${stats?.lossRatio ?? 0}%`}
            </div>
            <div className="text-sm text-slate-400">Loss Ratio (This Week)</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Weekly Payouts (Last 8 Weeks)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPayoutsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Worker Enrollment Growth
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="workers" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Zone Risk Map</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Zone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Risk Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Active Workers</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Claims This Week</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {zoneData.map((zone) => (
                  <tr key={zone.zone} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{zone.zone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(zone.risk)}`}>
                        {zone.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{zone.activeWorkers}</td>
                    <td className="px-6 py-4 text-sm text-white">{zone.claimsThisWeek}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-500">
                      ₹{zone.exposure.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Claims Queue — real data with working approve/reject */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Claims Queue</h3>
            {recentClaims.length > 0 ? (
              <div className="space-y-3">
                {recentClaims.slice(0, 6).map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-slate-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-semibold truncate">
                        {claim.workers?.name || 'Unknown Worker'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {claim.trigger_name} · {claim.workers?.zone}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          Fraud: {claim.fraud_score}/100
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(claim.status)}`}>
                          {claim.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-emerald-500 font-bold mr-2">
                        ₹{claim.amount}
                      </div>
                      {claim.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'approved')}
                            disabled={actionLoading === claim.id + 'approved'}
                            title="Approve"
                            className="w-8 h-8 bg-emerald-500/10 hover:bg-emerald-500/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'rejected')}
                            disabled={actionLoading === claim.id + 'rejected'}
                            title="Reject"
                            className="w-8 h-8 bg-red-500/10 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No recent claims</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Fraud Detection Log</h3>
            <div className="space-y-3">
              {fraudEvents.map((event) => (
                <div key={event.id} className={`rounded-lg p-4 ${getFraudColor(event.score)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">{event.id}</div>
                    <div className={`text-lg font-bold ${getFraudTextColor(event.score)}`}>
                      {event.score}/100
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <div className="text-slate-400">GPS</div>
                      <div className="text-white font-medium">{event.gps}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Activity</div>
                      <div className="text-white font-medium">{event.activity}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Anomaly</div>
                      <div className="text-white font-medium">{event.anomaly}%</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    Action: <span className="font-semibold">{event.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Predictive Alert</h3>
              <p className="text-slate-300">
                High rainfall probability next week in Koramangala and Andheri.
                Estimated exposure: <span className="font-bold">₹2.3L</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
