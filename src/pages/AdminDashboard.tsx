/**
 * AdminDashboard.tsx
 * Insurer analytics dashboard — real DB stats, live claims queue with approve/reject.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, FileText, DollarSign, TrendingUp,
  AlertTriangle, LogOut, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/LoadingSpinner';
import { generate7DayForecast } from '../lib/aiEngine';
import { KPICard } from '../components/ui/KPICard';

interface RecentClaim {
  id: string;
  trigger_name: string;
  fraud_score: number;
  amount: number;
  status: string;
  workers?: { name?: string; zone?: string };
}

interface AdminStats {
  totalWorkers:    number;
  activePolicies:  number;
  weeklyPayouts:   number;
  lossRatio:       number;
}

/** Illustrative chart data — shown alongside real DB KPIs */
const weeklyPayoutsData = [
  { week: 'W1', amount: 38200 }, { week: 'W2', amount: 42500 },
  { week: 'W3', amount: 45800 }, { week: 'W4', amount: 51200 },
  { week: 'W5', amount: 48900 }, { week: 'W6', amount: 52300 },
  { week: 'W7', amount: 47100 }, { week: 'W8', amount: 48230 },
];

const enrollmentData = [
  { week: 'W1', workers: 245 },  { week: 'W2', workers: 389 },
  { week: 'W3', workers: 512 },  { week: 'W4', workers: 678 },
  { week: 'W5', workers: 789 },  { week: 'W6', workers: 891 },
  { week: 'W7', workers: 1023 }, { week: 'W8', workers: 1156 },
  { week: 'W9', workers: 1247 },
];

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' },
  labelStyle:   { color: '#f1f5f9' },
  itemStyle:    { color: '#10b981' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, setIsAdmin } = useAuth();
  const toast = useToast();

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  const [showLogin, setShowLogin] = useState(!isAdmin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [recentClaims,  setRecentClaims]  = useState<RecentClaim[]>([]);
  const [dbZoneData,    setDbZoneData]    = useState<Record<string, string | number>[]>([]);
  const [stats,         setStats]         = useState<AdminStats | null>(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { count: workerCount } = await supabase.from('workers').select('id', { count: 'exact', head: true });
      const { count: policyCount } = await supabase.from('policies').select('id', { count: 'exact', head: true }).eq('status', 'active');

      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: weekClaims }  = await supabase.from('claims').select('amount, status').gte('created_at', weekStart);
      const { data: weekPolicies } = await supabase.from('policies').select('final_premium').gte('created_at', weekStart);

      const weeklyPayouts = (weekClaims ?? []).filter((c) => c.status === 'approved').reduce((s, c) => s + c.amount, 0);
      const weeklyPremium = (weekPolicies ?? []).reduce((s, p) => s + p.final_premium, 0);

      setStats({
        totalWorkers:   workerCount ?? 0,
        activePolicies: policyCount ?? 0,
        weeklyPayouts,
        lossRatio: weeklyPremium > 0 ? Math.round((weeklyPayouts / weeklyPremium) * 100) : 0,
      });

      // Aggregate DB zone data
      const { data: workersList } = await supabase.from('workers').select('zone');
      if (workersList) {
         const zData: Record<string, Record<string, string | number>> = {};
         for (const w of workersList) {
           const z = w.zone || 'Unknown';
           if (!zData[z]) zData[z] = { zone: z, activeWorkers: 0, claimsThisWeek: 0, exposure: 0, risk: 'Medium' };
           zData[z].activeWorkers++;
         }
         
         const weekStartStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
         const { data: recentAllClaims } = await supabase.from('claims').select('amount, workers(zone)').gte('created_at', weekStartStr);
         if (recentAllClaims) {
            for (const c of recentAllClaims) {
                const z = c.workers?.zone || 'Unknown';
                if (zData[z]) {
                   zData[z].claimsThisWeek++;
                   zData[z].exposure += c.amount;
                }
            }
         }
         
         Object.keys(zData).forEach(z => {
            if (['Koramangala', 'Andheri'].includes(z)) zData[z].risk = 'High';
            if (['Connaught Place'].includes(z)) zData[z].risk = 'Low';
         });

         setDbZoneData(Object.values(zData));
      }
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadRecentClaims = useCallback(async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('*, workers(name, zone)')
      .order('created_at', { ascending: false })
      .limit(8);
    setRecentClaims(error ? [] : data || []);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    loadRecentClaims();
    // Poll claims every 30 seconds
    const interval = setInterval(loadRecentClaims, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin, loadStats, loadRecentClaims]);

  const handleClaimAction = async (claimId: string, action: 'approved' | 'rejected') => {
    setActionLoading(claimId + action);
    const { error } = await supabase.from('claims').update({ status: action }).eq('id', claimId);
    if (!error) {
      setRecentClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status: action } : c)));
      toast.success(`Claim ${action}`, action === 'approved' ? 'Payout has been triggered.' : 'Claim has been rejected.');
    } else {
      toast.error('Action failed', 'Please try again.');
    }
    setActionLoading(null);
  };

  const handleLogin = () => {
    if (!adminUsername || !adminPassword) {
      setLoginError('Admin credentials not configured in .env');
      return;
    }
    if (username === adminUsername && password === adminPassword) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const getRiskColor = (risk: string) => {
    const map: Record<string, string> = {
      High:   'text-red-400    bg-red-500/10    border border-red-500/30',
      Medium: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30',
      Low:    'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30',
    };
    return map[risk] ?? 'text-slate-400 bg-slate-700';
  };

  const getStatusBadge = (status: string) => ({
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/10    text-red-400    border-red-500/30',
    pending:  'bg-yellow-500/10 text-yellow-400  border-yellow-500/30',
  }[status] ?? 'bg-slate-700 text-slate-400 border-slate-600');

  // ── Admin Login ──
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl glass-emerald flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">ShieldRoute</h1>
            <p className="text-slate-400 text-sm mt-1">Admin Portal</p>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-white mb-6">Admin Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="admin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                  {loginError}
                </p>
              )}
              <button onClick={handleLogin} className="btn-primary w-full py-3">
                Login to Admin Dashboard
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary w-full py-3">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ──
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <nav className="nav-glass border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg glass-emerald flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">ShieldRoute</span>
            <span className="badge bg-slate-800 text-slate-400 border border-slate-700 text-[10px] ml-1">ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/fraud')}
              className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Fraud Center
            </button>
            <button
              onClick={() => { setIsAdmin(false); navigate('/'); }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-1">Platform Analytics Engine</h1>
          <p className="text-slate-400">Monitor real-time exposure matrices and system stability overlays</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statsLoading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {[
                { icon: <Users className="w-6 h-6 text-blue-400" />,     bg: 'bg-blue-500/10 text-blue-400',   val: (stats?.totalWorkers ?? 0).toLocaleString(),        label: 'Active Network Fleet',           sub: 'verified units', highlight: false },
                { icon: <FileText className="w-6 h-6 text-emerald-400" />, bg: 'bg-emerald-500/10 text-emerald-400', val: (stats?.activePolicies ?? 0).toLocaleString(),   label: 'In-Force Underwriting',         sub: 'active coverage', highlight: false },
                { icon: <DollarSign className="w-6 h-6 text-purple-400" />, bg: 'bg-purple-500/10 text-purple-400', val: `₹${(stats?.weeklyPayouts ?? 0).toLocaleString('en-IN')}`, label: 'Disbursed Capital', sub: 'T+2h cleared', highlight: false },
                { icon: <TrendingUp className="w-6 h-6 text-orange-400" />, bg: 'bg-orange-500/10 text-orange-400', val: `${stats?.lossRatio ?? 0}%`, label: 'Systemic Exposure', sub: '7-day rolling LR', highlight: (stats?.lossRatio ?? 0) > 80 },
              ].map((item) => (
                 <KPICard key={item.label} icon={item.icon} iconBg={item.bg} value={item.val} label={`${item.label} (${item.sub})`} valueColor={item.highlight ? 'text-red-400' : 'text-white'} />
              ))}
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Weekly Payouts</h3>
              <span className="text-xs text-slate-500">Illustrative data</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyPayoutsData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Payouts']} />
                <Bar dataKey="amount" fill="url(#emeraldGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Worker Enrollment</h3>
              <span className="text-xs text-slate-500">Illustrative data</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), 'Workers']} />
                <Line type="monotone" dataKey="workers" stroke="#10b981" strokeWidth={2.5}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Risk Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-bold text-white mb-5">Geospatial Exposure Map</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Zone', 'Risk Level', 'Active Workers', 'Claims This Week', 'Exposure'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {dbZoneData.map((zone) => (
                  <tr key={zone.zone} className="table-row-hover">
                    <td className="px-4 py-4 font-medium text-white">{zone.zone}</td>
                    <td className="px-4 py-4">
                      <span className={`badge ${getRiskColor(zone.risk)}`}>{zone.risk}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-300 stat-number">{zone.activeWorkers}</td>
                    <td className="px-4 py-4 text-slate-300 stat-number">{zone.claimsThisWeek}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-400 stat-number">
                      ₹{zone.exposure.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Claims Queue + Fraud Log */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Claims Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Claims Queue</h3>
              <button
                onClick={loadRecentClaims}
                className="text-slate-400 hover:text-white transition-colors"
                title="Refresh"
                aria-label="Refresh claims"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {recentClaims.length > 0 ? (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {recentClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-slate-800 rounded-lg p-4 flex items-center justify-between gap-3 table-row-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-sm truncate">
                        {claim.workers?.name ?? 'Unknown Worker'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {claim.trigger_name} · {claim.workers?.zone ?? '—'}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-slate-500">Fraud: {claim.fraud_score}/100</span>
                        <span className={`badge border ${getStatusBadge(claim.status)} text-[10px]`}>
                          {claim.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-400 text-sm">₹{claim.amount}</span>
                      {claim.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'approved')}
                            disabled={!!actionLoading}
                            title="Approve"
                            aria-label="Approve claim"
                            className="w-8 h-8 bg-emerald-500/10 hover:bg-emerald-500/25 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'rejected')}
                            disabled={!!actionLoading}
                            title="Reject"
                            aria-label="Reject claim"
                            className="w-8 h-8 bg-red-500/10 hover:bg-red-500/25 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <EmptyState title="No recent claims" description="Logged claims will appear here." icon={<FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />} />
            )}
          </div>

          {/* Fraud Detection Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-100">
            <h3 className="text-lg font-bold text-white mb-5 flex justify-between items-center">
              <span>ML Heuristic Verification Logging</span>
              <span className="badge bg-slate-800 text-slate-400 text-xs">Isolation Forest (L1-L5)</span>
            </h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {recentClaims.slice(0, 5).map((claim) => {
                const isHigh = claim.fraud_score >= 61;
                const isMid  = claim.fraud_score >= 31;
                const color  = isHigh ? 'text-red-400 bg-red-500/10 border-red-500/20' : isMid ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                // Map real db values back to simple array or default
                const scoreObj = claim as unknown as { fraud_flags: Record<string, number> };
                const L1 = scoreObj.fraud_flags?.L1_GPS ?? 0;
                const L3 = scoreObj.fraud_flags?.L3_Anomaly ?? 0;
                const actionText = claim.status === 'approved' ? 'Passed' : claim.status === 'pending' ? 'Soft Review' : 'Blocked';

                return (
                  <div key={claim.id} className={`rounded-lg p-4 border ${color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-white">{claim.id.split('-')[0].toUpperCase()}</span>
                      <div className={`text-lg font-black ${isHigh ? 'text-red-400' : isMid ? 'text-yellow-400' : 'text-emerald-400'} stat-number`}>
                        {claim.fraud_score}/100
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <div className="text-slate-400">Worker</div>
                        <div className="text-white font-medium">{claim.workers?.name || 'Unknown'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">ML Insights</div>
                        <div className="text-white font-medium">L1: {L1} │ Anm: {L3}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300">
                      Action: <span className="font-semibold">{actionText}</span>
                    </div>
                  </div>
                );
              })}
              {recentClaims.length === 0 && (
                <div className="text-slate-500 text-sm text-center py-4">No logged claims. Use Simulation panel.</div>
              )}
            </div>
          </div>
        </div>

        {/* Predictive Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="font-bold text-white text-lg">7-Day Predictive Risk Forecast</h3>
            <span className="badge bg-slate-800 text-slate-400 text-xs ml-2">Prophet + LSTM Model</span>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-400">Delivery Zone</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-400">Risk Trend</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-400">Expected Triggers</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-400">Forecast Confidence</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-400">Estimated Exposure</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                 {generate7DayForecast(['Koramangala', 'Andheri', 'Banjara Hills', 'Connaught Place', 'T Nagar']).map(f => (
                   <tr key={f.zone} className="hover:bg-slate-800/50 transition-colors">
                     <td className="px-4 py-3 font-medium text-white">{f.zone}</td>
                     <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 ${f.riskTrend === 'Increasing' ? 'text-orange-400' : f.riskTrend === 'Decreasing' ? 'text-emerald-400' : 'text-slate-400'}`}>
                           {f.riskTrend === 'Increasing' ? '↑' : f.riskTrend === 'Decreasing' ? '↓' : '→'} {f.riskTrend}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-center font-bold text-slate-300">{f.expectedTriggers}</td>
                     <td className="px-4 py-3 text-center text-slate-400">{f.confidence}%</td>
                     <td className="px-4 py-3 text-right font-black text-orange-400 stat-number">₹{f.payoutExposure.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
