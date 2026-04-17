/**
 * PlanSelection.tsx
 * Plan picker with dynamic premium calculation and animated payment modal.
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock, BarChart3 } from 'lucide-react';
import { supabase, Worker } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { computePremiumMultipliers, MLPremiumResult } from '../lib/aiEngine';

interface Plan {
  type: string;
  basePremium: number;
  name: string;
  triggers: string[];
  maxPayout: number;
  recommended?: boolean;
  emoji: string;
}

const plans: Plan[] = [
  {
    type: 'Basic',
    basePremium: 29,
    name: 'Basic Protection',
    triggers: ['Rain'],
    maxPayout: 500,
    emoji: '🛡️',
  },
  {
    type: 'Standard',
    basePremium: 49,
    name: 'Standard Coverage',
    triggers: ['Rain', 'Heat', 'AQI'],
    maxPayout: 1000,
    recommended: true,
    emoji: '⭐',
  },
  {
    type: 'Plus',
    basePremium: 79,
    name: 'Complete Shield',
    triggers: ['Rain', 'Heat', 'AQI', 'Flood', 'Curfew'],
    maxPayout: 2000,
    emoji: '🔰',
  },
];

const allTriggers = ['Rain', 'Heat', 'AQI', 'Flood', 'Curfew'];

const TRIGGER_EMOJIS: Record<string, string> = {
  Rain: '🌧️', Heat: '🔥', AQI: '💨', Flood: '🌊', Curfew: '🚫',
};

export default function PlanSelection() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const toast     = useToast();
  const { worker: authWorker, setWorker, isReady } = useAuth();

  const worker = useMemo(
    () => (location.state?.worker as Worker | undefined) ?? authWorker,
    [location.state, authWorker]
  );

  const [selectedPlan,   setSelectedPlan]   = useState<Plan | null>(null);
  const [showModal,      setShowModal]      = useState(false);
  const [paySuccess,     setPaySuccess]     = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [recentClaims,   setRecentClaims]   = useState(0);
  const [premiumLoading, setPremiumLoading] = useState(true);

  useEffect(() => {
    if (isReady && !worker) navigate('/onboard', { replace: true });
  }, [isReady, worker, navigate]);

  useEffect(() => {
    if (!worker) return;
    const fetchClaimCount = async () => {
      const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('claims')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', worker.id)
        .gte('created_at', eightWeeksAgo);
      setRecentClaims(count ?? 0);
      setPremiumLoading(false);
    };
    fetchClaimCount();
  }, [worker]);

  if (!isReady || !worker) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500"
          style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const calcPremium = (base: number): MLPremiumResult => computePremiumMultipliers(worker, recentClaims, base);

  const handlePayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setPaySuccess(true);

    const mlPremium = calcPremium(selectedPlan.basePremium);
    const finalPremium = mlPremium.finalPremium;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { error } = await supabase.from('policies').insert({
      worker_id:         worker.id,
      plan_type:         selectedPlan.type,
      base_premium:      selectedPlan.basePremium,
      final_premium:     finalPremium,
      coverage_triggers: selectedPlan.triggers,
      max_payout:        selectedPlan.maxPayout,
      status:            'active',
      end_date:          endDate.toISOString(),
      weeks_covered:     1,
      total_premium_paid: finalPremium,
    });

    if (error) {
      toast.error('Payment Failed', 'Error creating policy. Please try again.');
      setLoading(false);
      setPaySuccess(false);
      return;
    }

    setWorker(worker);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-16 px-4">
      {/* Background orbs */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Choose Your Shield</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Choose Your Protection Plan
          </h1>
          <p className="text-slate-400 text-lg">
            Coverage tailored for{' '}
            <span className="text-emerald-400 font-semibold">{worker.zone}</span> delivery partners
          </p>

          {/* Dynamic formula banner */}
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 mt-6 text-left max-w-2xl mx-auto flex gap-4 items-start shadow-xl animate-slide-up">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white">AI Premium Engine</span>
                <span className="badge bg-emerald-500/20 text-emerald-400 border-none text-[10px]">XGBoost Model</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Premiums are dynamically adjusted per individual based on local weather risk datasets, your retention history, and claim velocity.
              </p>
              {!premiumLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {calcPremium(plans[1].basePremium).factors.map((f) => (
                    <div key={f.name} className="bg-slate-800 rounded p-2 border border-slate-700/50">
                      <div className="text-[10px] text-slate-400 truncate mb-1">{f.name}</div>
                      <div className={`text-sm font-bold ${f.impact === 'negative' ? 'text-red-400' : f.impact === 'positive' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {f.weight}% weight
                      </div>
                    </div>
                  ))}
                </div>
               ) : (
                 <div className="h-12 w-full bg-slate-800 rounded animate-pulse" />
               )}
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, i) => {
            const mlPremium = premiumLoading ? null : calcPremium(plan.basePremium);
            const finalPremium = mlPremium?.finalPremium ?? plan.basePremium;

            return (
              <div
                key={plan.type}
                className={`relative rounded-2xl border-2 p-8 transition-all hover-glow animate-slide-up ${
                  plan.recommended
                    ? 'border-emerald-500 bg-slate-900 glow-emerald-sm'
                    : 'border-slate-700 bg-slate-900/80'
                }`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-emerald text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    ⭐ AI Recommended
                  </div>
                )}

                <div className="text-3xl mb-3">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-black ${plan.recommended ? 'text-emerald-400' : 'text-white'}`}>
                    ₹{premiumLoading ? '...' : finalPremium}
                  </span>
                  <span className="text-slate-400">/week</span>
                </div>

                {!premiumLoading && mlPremium && mlPremium.finalPremium !== mlPremium.basePremium && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="line-through">₹{mlPremium.basePremium} base</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      → AI Adjusted
                    </span>
                  </div>
                )}

                <div className="space-y-2.5 mb-6 mt-4">
                  {allTriggers.map((trigger) => {
                    const included = plan.triggers.includes(trigger);
                    return (
                      <div key={trigger} className="flex items-center gap-2.5">
                        {included ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0" />
                        )}
                        <span className={`text-sm ${included ? 'text-white' : 'text-slate-600'}`}>
                          {TRIGGER_EMOJIS[trigger]} {trigger} coverage
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-800 mt-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-emerald-400">
                        Max payout: ₹{plan.maxPayout.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id={`select-plan-${plan.type.toLowerCase()}`}
                  onClick={() => { setSelectedPlan(plan); setShowModal(true); }}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.recommended
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  Select {plan.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature strip */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          {[
            { icon: <Lock className="w-4 h-4 text-emerald-400" />, label: 'No long-term commitments' },
            { icon: <Zap className="w-4 h-4 text-emerald-400" />,  label: 'Instant UPI payouts' },
            { icon: <Shield className="w-4 h-4 text-emerald-400" />, label: '5-layer fraud protection' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-fast">
          <div className="glass-card max-w-sm w-full p-8 animate-scale-in">
            {!paySuccess ? (
              <>
                <h3 className="text-xl font-bold text-white mb-6">Confirm Payment</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-400">AI Premium (Weekly)</span>
                    <span className="text-emerald-400 font-bold">₹{calcPremium(selectedPlan.basePremium).finalPremium}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-400">Coverage Window</span>
                    <span className="text-white">1 Week</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 mt-2">
                    <span className="text-white">Total Output</span>
                    <span className="text-emerald-400 text-xl">₹{calcPremium(selectedPlan.basePremium).finalPremium}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    id="confirm-payment-btn"
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white"
                          style={{ animation: 'spin 0.8s linear infinite' }} />
                        Processing...
                      </>
                    ) : (
                      <>Pay ₹{calcPremium(selectedPlan.basePremium).finalPremium} via UPI</>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowModal(false); setSelectedPlan(null); }}
                    disabled={loading}
                    className="w-full btn-secondary py-3"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-5 animate-scale-in">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Payment Successful!</h3>
                  <p className="text-slate-400 text-sm">Your policy is now active.</p>
                  <p className="text-slate-500 text-xs mt-1">Redirecting to dashboard...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
