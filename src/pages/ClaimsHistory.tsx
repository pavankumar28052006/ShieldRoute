import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Claim } from '../lib/supabase';

type FilterType = 'all' | 'approved' | 'pending' | 'rejected';

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
    if (!worker) {
      navigate('/onboard');
      return;
    }
    loadClaims();
  }, [worker, navigate, loadClaims]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  const filteredClaims = claims.filter((claim) => {
    if (filter === 'all') return true;
    return claim.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">ShieldRoute</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Claims History</h1>
          <p className="text-slate-400">
            All your claims and payouts in one place
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <div className="flex gap-2">
                {(['all', 'approved', 'pending', 'rejected'] as FilterType[]).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === f
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {filteredClaims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Trigger Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Zone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Payout Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Fraud Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white">
                        {new Date(claim.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {claim.trigger_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {claim.trigger_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {worker?.zone}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-500">
                        ₹{claim.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            claim.status
                          )}`}
                        >
                          {claim.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              claim.fraud_score < 30
                                ? 'text-emerald-500'
                                : claim.fraud_score < 60
                                ? 'text-yellow-500'
                                : 'text-red-500'
                            }`}
                          >
                            {claim.fraud_score}/100
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400">No claims found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
