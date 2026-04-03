import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, X, Info } from 'lucide-react';
import { supabase, Worker } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  type: string;
  basePremium: number;
  name: string;
  triggers: string[];
  maxPayout: number;
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    type: 'Basic',
    basePremium: 29,
    name: 'Basic Protection',
    triggers: ['Rain'],
    maxPayout: 500,
  },
  {
    type: 'Standard',
    basePremium: 49,
    name: 'Standard Coverage',
    triggers: ['Rain', 'Heat', 'AQI'],
    maxPayout: 1000,
    recommended: true,
  },
  {
    type: 'Plus',
    basePremium: 79,
    name: 'Complete Shield',
    triggers: ['Rain', 'Heat', 'AQI', 'Flood', 'Curfew'],
    maxPayout: 2000,
  },
];

const allTriggers = ['Rain', 'Heat', 'AQI', 'Flood', 'Curfew'];

/**
 * Zone risk multipliers per README §5 Dynamic Premium Formula.
 * Range 0.8–1.4 based on historical disruption frequency.
 */
const ZONE_RISK_MULTIPLIER: Record<string, number> = {
  Koramangala: 1.4,     // Flood-prone, high disruption history
  Andheri: 1.3,         // Flood-prone
  'Banjara Hills': 1.1, // Moderate heat & AQI risk
  'T Nagar': 1.1,       // Moderate AQI risk
  'Connaught Place': 0.9, // Historically safer zone
};

/** Tenure discount per README §5 */
function getTenureDiscount(workerCreatedAt: string): number {
  const weeks = Math.floor(
    (Date.now() - new Date(workerCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  if (weeks >= 12) return 0.90;
  if (weeks >= 4) return 0.95;
  return 1.0;
}

/** Claim history factor per README §5 */
function getClaimHistoryFactor(recentClaimCount: number): number {
  if (recentClaimCount >= 2) return 1.30;
  if (recentClaimCount === 1) return 1.15;
  return 1.0;
}

export default function PlanSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { worker: authWorker, setWorker, isReady } = useAuth();
  const worker = useMemo(
    () => (location.state?.worker as Worker | undefined) ?? authWorker,
    [location.state, authWorker]
  );

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic premium state
  const [recentClaimCount, setRecentClaimCount] = useState(0);
  const [premiumLoading, setPremiumLoading] = useState(true);

  useEffect(() => {
    if (isReady && !worker) {
      navigate('/onboard', { replace: true });
    }
  }, [isReady, worker, navigate]);

  // Fetch rolling 8-week claim count for accurate premium
  useEffect(() => {
    if (!worker) return;
    const fetchClaimCount = async () => {
      const eightWeeksAgo = new Date(
        Date.now() - 8 * 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { count } = await supabase
        .from('claims')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', worker.id)
        .gte('created_at', eightWeeksAgo);
      setRecentClaimCount(count ?? 0);
      setPremiumLoading(false);
    };
    fetchClaimCount();
  }, [worker]);

  if (!isReady || !worker) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const zoneMultiplier = ZONE_RISK_MULTIPLIER[worker.zone] ?? 1.0;
  const tenureDiscount = getTenureDiscount(worker.created_at);
  const claimFactor = getClaimHistoryFactor(recentClaimCount);

  const calculateFinalPremium = (basePremium: number) => {
    return Math.round(basePremium * zoneMultiplier * tenureDiscount * claimFactor);
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPaymentSuccess(true);

    const finalPremium = calculateFinalPremium(selectedPlan.basePremium);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { error } = await supabase.from('policies').insert({
      worker_id: worker.id,
      plan_type: selectedPlan.type,
      base_premium: selectedPlan.basePremium,
      final_premium: finalPremium,
      coverage_triggers: selectedPlan.triggers,
      max_payout: selectedPlan.maxPayout,
      status: 'active',
      end_date: endDate.toISOString(),
      weeks_covered: 1,
      total_premium_paid: finalPremium,
    });

    if (error) {
      console.error('Error creating policy:', error);
      alert('Error creating policy. Please try again.');
      setLoading(false);
      return;
    }

    setWorker(worker);

    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  // Human-readable formula breakdown
  const formulaParts = (base: number) => {
    const parts: string[] = [`₹${base} base`];
    if (zoneMultiplier !== 1.0) parts.push(`×${zoneMultiplier} zone risk`);
    if (tenureDiscount !== 1.0) parts.push(`×${tenureDiscount} tenure`);
    if (claimFactor !== 1.0) parts.push(`×${claimFactor} claim history`);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Protection Plan
          </h1>
          <p className="text-slate-400">
            Coverage tailored for <span className="text-emerald-400 font-medium">{worker.zone}</span> delivery partners
          </p>

          {/* Dynamic formula info banner */}
          {!premiumLoading && (zoneMultiplier !== 1.0 || tenureDiscount !== 1.0 || claimFactor !== 1.0) && (
            <div className="inline-flex items-center gap-2 mt-4 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-400">
              <Info className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                Zone risk: <span className="text-white font-medium">×{zoneMultiplier}</span>
                {tenureDiscount !== 1.0 && (
                  <> · Tenure discount: <span className="text-emerald-400 font-medium">×{tenureDiscount}</span></>
                )}
                {claimFactor !== 1.0 && (
                  <> · Claim history: <span className="text-yellow-400 font-medium">×{claimFactor}</span></>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const finalPremium = calculateFinalPremium(plan.basePremium);
            const hasAdjustment = finalPremium !== plan.basePremium;

            return (
              <div
                key={plan.type}
                className={`bg-slate-900 border rounded-xl p-8 relative ${
                  plan.recommended
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'border-slate-800'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-emerald-500">
                      ₹{premiumLoading ? '...' : finalPremium}
                    </span>
                    <span className="text-slate-400">/week</span>
                  </div>
                  {hasAdjustment && !premiumLoading && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {formulaParts(plan.basePremium)} = ₹{finalPremium}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {allTriggers.map((trigger) => {
                    const included = plan.triggers.includes(trigger);
                    return (
                      <div key={trigger} className="flex items-center gap-3">
                        {included ? (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={included ? 'text-white' : 'text-slate-600'}>
                          {trigger} coverage
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-white">
                        Max payout: ₹{plan.maxPayout}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.recommended
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full">
            {!paymentSuccess ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-6">
                  Confirm Payment
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Premium</span>
                    <span className="text-white">₹{selectedPlan.basePremium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zone Multiplier</span>
                    <span className={zoneMultiplier > 1 ? 'text-yellow-400' : 'text-emerald-400'}>×{zoneMultiplier}</span>
                  </div>
                  {tenureDiscount !== 1.0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tenure Discount</span>
                      <span className="text-emerald-400">×{tenureDiscount}</span>
                    </div>
                  )}
                  {claimFactor !== 1.0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Claim History Factor</span>
                      <span className="text-yellow-400">×{claimFactor}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coverage</span>
                    <span className="text-white">1 Week</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                    <span className="text-white">Total Amount</span>
                    <span className="text-emerald-500">
                      ₹{calculateFinalPremium(selectedPlan.basePremium)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {loading
                      ? 'Processing Payment...'
                      : `Pay ₹${calculateFinalPremium(selectedPlan.basePremium)} via UPI`}
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedPlan(null);
                    }}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Payment Successful!
                </h3>
                <p className="text-slate-400">
                  Your policy is now active. Redirecting to dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
