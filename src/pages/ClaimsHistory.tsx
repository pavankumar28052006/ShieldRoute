/**
 * ClaimsHistory.tsx
 * Full claims table with filter tabs, status badges, and fraud score indicators.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Filter, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Claim } from '../lib/supabase';
import { SkeletonRow } from '../components/LoadingSpinner';

type FilterType = 'all' | 'approved' | 'pending' | 'rejected';

const DISRUPTION_EMOJIS: Record<string, string> = {
  T01: '🌧️', T02: '🔥', T03: '💨', T04: '🌊', T05: '🚫',
};

export default function ClaimsHistory() {
  const { worker } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const loadClaims = useCallback(async () => {
    if (!worker) return;
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false });
    setClaims(data || []);
    setLoading(false);
  }, [worker]);

  useEffect(() => {
    if (!worker) { navigate('/onboard'); return; }
    loadClaims();
  }, [worker, navigate, loadClaims]);

  const filteredClaims = claims.filter((c) => filter === 'all' || c.status === filter);

  const totals = {
    approved: claims.filter((c) => c.status === 'approved').reduce((s, c) => s + c.amount, 0),
    count:    claims.length,
    pending:  claims.filter((c) => c.status === 'pending').length,
  };

  const getFilterCount = (f: FilterType) =>
    f === 'all' ? claims.length : claims.filter((c) => c.status === f).length;

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
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-1">Claims History</h1>
          <p className="text-slate-400">All your automatic payouts and claim statuses</p>
        </div>

        {/* Summary Cards */}
        {!loading && claims.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
            {[
              { icon: <FileText className="w-5 h-5 text-blue-400" />,    bg: 'bg-blue-500/10',    val: totals.count,                                  label: 'Total Claims' },
              { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10', val: `₹${totals.approved.toLocaleString('en-IN')}`, label: 'Total Received' },
              { icon: <TrendingUp className="w-5 h-5 text-yellow-400" />,  bg: 'bg-yellow-500/10',  val: totals.pending,                                label: 'Pending Review' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover-glow transition-all">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                  {stat.icon}
                </div>
                <div className="text-xl font-black text-white stat-number">{stat.val}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-fade-in delay-100">
          {/* Filter bar */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-2 flex-wrap">
                {(['all', 'approved', 'pending', 'rejected'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({getFilterCount(f)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filteredClaims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Date', 'Trigger', 'Zone', 'Payout', 'Status', 'Fraud Score'].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {new Date(claim.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{DISRUPTION_EMOJIS[claim.trigger_type] || '⚡'}</span>
                          <div>
                            <div className="font-medium text-white">{claim.trigger_name}</div>
                            <div className="text-xs text-slate-500 font-mono">{claim.trigger_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{worker?.zone}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400 stat-number">
                        ₹{claim.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge border ${getStatusBadge(claim.status)}`}>
                          {claim.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                claim.fraud_score <= 30 ? 'bg-emerald-500' :
                                claim.fraud_score <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${claim.fraud_score}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold stat-number ${getFraudColor(claim.fraud_score)}`}>
                            {claim.fraud_score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-white font-semibold mb-1">
                {filter === 'all' ? 'No claims yet' : `No ${filter} claims`}
              </p>
              <p className="text-slate-400 text-sm">
                {filter === 'all'
                  ? 'Payouts will appear here automatically when disruption triggers fire'
                  : 'Try a different filter'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
