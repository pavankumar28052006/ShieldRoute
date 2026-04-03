import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Activity,
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  LogOut,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Policy, Claim, Worker } from '../lib/supabase';
import { getWeatherForZone, checkActiveTriggers, WeatherData } from '../lib/weather';

interface DisruptionType {
  id: string;
  name: string;
  code: string;
  threshold: string;
  payout: number;
}

const disruptions: DisruptionType[] = [
  { id: 'T01', name: 'Heavy Rainfall', code: 'T01', threshold: '68mm in 6 hrs', payout: 600 },
  { id: 'T02', name: 'Extreme Heat', code: 'T02', threshold: '46°C', payout: 450 },
  { id: 'T03', name: 'Severe AQI', code: 'T03', threshold: 'AQI 463', payout: 380 },
  { id: 'T04', name: 'Flood Warning', code: 'T04', threshold: 'Government Alert', payout: 800 },
  { id: 'T05', name: 'Curfew/Bandh', code: 'T05', threshold: 'Official Declaration', payout: 1000 },
];

const TRIGGER_NAME_MAP: Record<string, string> = {
  'Heavy Rainfall': 'Rain',
  'Extreme Heat': 'Heat',
  'Severe AQI': 'AQI',
  'Flood Warning': 'Flood',
  'Curfew/Bandh': 'Curfew',
};

interface SimulationStep {
  message: string;
  icon: string;
}

/**
 * Compute a rule-based fraud risk score for a claim.
 * Score range: 0–100, based on account age and claim frequency.
 * L1 GPS always passes in this prototype (zone is declared at signup).
 */
function computeFraudScore(worker: Worker, allClaims: Claim[]): number {
  let score = 0;

  // Account age: brand-new accounts are inherently higher risk
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (accountAgeDays < 7) score += 25;
  else if (accountAgeDays < 30) score += 12;

  // Claim frequency: claims in rolling 8-week window
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
  const recentClaimCount = allClaims.filter(
    (c) => new Date(c.created_at) > eightWeeksAgo
  ).length;

  if (recentClaimCount >= 2) score += 30;
  else if (recentClaimCount === 1) score += 15;

  // L4: single account per phone (enforced by DB unique constraint) → 0 extra points

  return Math.min(score, 100);
}

export default function Dashboard() {
  const { worker, logout } = useAuth();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSimulation, setShowSimulation] = useState(false);
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionType | null>(null);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const simulationSteps: SimulationStep[] = [
    { message: 'Trigger Detected — threshold breached', icon: '🔍' },
    { message: 'Cross-referencing active policies in zone...', icon: '📋' },
    { message: 'Running fraud validation stack (L1–L4)...', icon: '🛡️' },
    { message: '', icon: '✅' }, // Dynamic fraud score message filled in startSimulation
    { message: 'Initiating UPI payout to worker...', icon: '💸' },
    { message: 'credited to UPI ID successfully!', icon: '🎉' },
  ];

  const loadData = useCallback(async () => {
    if (!worker) return;

    const { data: policyData } = await supabase
      .from('policies')
      .select('*')
      .eq('worker_id', worker.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setPolicy(policyData);

    const { data: claimsData } = await supabase
      .from('claims')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false });

    setClaims(claimsData || []);
    setLoading(false);
  }, [worker]);

  // Load live weather for the worker's zone
  const loadWeather = useCallback(async () => {
    if (!worker) return;
    setWeatherLoading(true);
    const data = await getWeatherForZone(worker.zone);
    setWeather(data);
    setWeatherLoading(false);
  }, [worker]);

  useEffect(() => {
    if (!worker) {
      navigate('/onboard');
      return;
    }
    loadData();
    loadWeather();

    // Poll weather every 15 minutes
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [worker, navigate, loadData, loadWeather]);

  const startSimulation = async (disruption: DisruptionType) => {
    if (!policy || !worker) return;

    const coveredTriggers = Array.isArray(policy.coverage_triggers)
      ? policy.coverage_triggers
      : [];
    const mappedTrigger = TRIGGER_NAME_MAP[disruption.name] || disruption.name;
    const isCovered = coveredTriggers.includes(mappedTrigger);

    if (!isCovered) {
      alert(`${disruption.name} is not covered by your current plan.`);
      return;
    }

    setSelectedDisruption(disruption);
    setIsSimulating(true);
    setSimulationStep(0);
    setShowSimulation(false);

    // Compute fraud score BEFORE inserting so we can show it in simulation
    const fraudScore = computeFraudScore(worker, claims);

    for (let i = 0; i < simulationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSimulationStep(i + 1);
    }

    const { data: newClaim } = await supabase
      .from('claims')
      .insert({
        worker_id: worker.id,
        policy_id: policy.id,
        trigger_type: disruption.code,
        trigger_name: disruption.name,
        amount: disruption.payout,
        status: fraudScore <= 30 ? 'approved' : fraudScore <= 60 ? 'pending' : 'rejected',
        fraud_score: fraudScore,
        fraud_flags: {
          gps_mismatch: 0,
          activity_signal: Math.min(fraudScore * 0.4, 20),
          anomaly_score: Math.min(fraudScore * 0.6, 30),
        },
      })
      .select()
      .single();

    if (newClaim) {
      setClaims([newClaim, ...claims]);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSimulating(false);
    setSimulationStep(0);
    setSelectedDisruption(null);
  };

  const getRiskLabel = (score: number) => {
    if (score < 60) return { label: 'Low', color: 'text-emerald-500 bg-emerald-500/10' };
    if (score < 75) return { label: 'Medium', color: 'text-yellow-500 bg-yellow-500/10' };
    return { label: 'High', color: 'text-red-500 bg-red-500/10' };
  };

  const getDaysRemaining = () => {
    if (!policy) return 0;
    const endDate = new Date(policy.end_date);
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTotalPayouts = () => {
    return claims.reduce((sum, claim) => sum + claim.amount, 0);
  };

  // Determine current fraud score label for most recent claim
  const latestFraudScore = claims.length > 0 ? claims[0].fraud_score : undefined;
  const fraudLabel = (score: number) => {
    if (score <= 30) return { text: `Score: ${score}/100 — AUTO APPROVED`, color: 'text-emerald-400' };
    if (score <= 60) return { text: `Score: ${score}/100 — SOFT REVIEW`, color: 'text-yellow-400' };
    return { text: `Score: ${score}/100 — HOLD`, color: 'text-red-400' };
  };

  // Active triggers based on live weather
  const activeTriggers =
    weather && policy
      ? checkActiveTriggers(weather, Array.isArray(policy.coverage_triggers) ? policy.coverage_triggers : [])
      : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No active policy found</p>
          <button
            onClick={() => navigate('/plans')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const riskData = getRiskLabel(worker!.risk_score);

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">ShieldRoute</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/simulate')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Simulate Payout
            </button>
            <button
              onClick={() => navigate('/claims')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Claims
            </button>
            <button
              onClick={async () => {
                await logout();
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
            Welcome, {worker!.name}
          </h1>
          <p className="text-slate-400">
            Zone: {worker!.zone} | Risk:{' '}
            <span className={riskData.color.split(' ')[0]}>
              {worker!.risk_score}/100
            </span>
          </p>
        </div>

        {/* Active Trigger Alert Banner */}
        {activeTriggers.length > 0 && (
          <div className="mb-6">
            {activeTriggers.map((t) => (
              <div
                key={t.code}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-400">{t.code} — {t.name} threshold met</span>
                  <span className="text-slate-300 text-sm ml-2">
                    {t.value} (threshold {t.threshold}) · Claim eligible — click Simulate Disruption
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900 border border-emerald-500 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {policy.plan_type} Plan
                </h2>
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ACTIVE
                </span>
              </div>
              <p className="text-slate-400">
                ₹{policy.final_premium}/week | Max Payout: ₹{policy.max_payout}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-500">
                {getDaysRemaining()} days
              </div>
              <div className="text-sm text-slate-400">remaining</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(policy.coverage_triggers as string[]).map((trigger) => (
              <span
                key={trigger}
                className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm"
              >
                {trigger}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {policy.weeks_covered}
                </div>
                <div className="text-sm text-slate-400">Weeks Covered</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  ₹{policy.total_premium_paid}
                </div>
                <div className="text-sm text-slate-400">Premium Paid</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  ₹{getTotalPayouts()}
                </div>
                <div className="text-sm text-slate-400">Total Payouts</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className={`flex items-center gap-3 mb-2`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${riskData.color}`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${riskData.color.split(' ')[0]}`}>
                  {riskData.label}
                </div>
                <div className="text-sm text-slate-400">Risk Level</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Payouts</h3>
            </div>
            {claims.length > 0 ? (
              <div className="space-y-4">
                {claims.slice(0, 3).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between bg-slate-800 rounded-lg p-4"
                  >
                    <div>
                      <div className="text-white font-semibold">
                        {claim.trigger_name}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </div>
                      {latestFraudScore !== undefined && claim.id === claims[0].id && (
                        <div className={`text-xs mt-1 ${fraudLabel(claim.fraud_score).color}`}>
                          {fraudLabel(claim.fraud_score).text}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-500 font-bold">
                        ₹{claim.amount}
                      </div>
                      <div className="text-xs text-slate-400">
                        {claim.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No payouts yet
              </p>
            )}
          </div>

          {/* Live Zone Status — real weather data */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Live Zone Status</h3>
              <span className="flex items-center gap-2 text-sm">
                {weatherLoading ? (
                  <span className="text-slate-500">Fetching...</span>
                ) : weather?.isLive ? (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">DEMO (add VITE_OPENWEATHERMAP_KEY for live)</span>
                )}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Weather</span>
                </div>
                <span className={`font-semibold ${weather?.description === 'Clear' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                  {weather?.description ?? 'Clear'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Rainfall</span>
                </div>
                <span className={`font-semibold ${(weather?.rainfall_mm ?? 0) >= 35 ? 'text-red-400' : 'text-slate-400'}`}>
                  {weather?.rainfall_mm != null ? `${weather.rainfall_mm.toFixed(1)}mm` : '0mm'}
                  {(weather?.rainfall_mm ?? 0) >= 35 && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">TRIGGER</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <span className="text-white">Temperature</span>
                </div>
                <span className={`font-semibold ${(weather?.temperature_c ?? 0) >= 44 ? 'text-red-400' : 'text-slate-400'}`}>
                  {weather?.temperature_c != null ? `${weather.temperature_c}°C` : '28°C'}
                  {(weather?.temperature_c ?? 0) >= 44 && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">TRIGGER</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-slate-400" />
                  <span className="text-white">AQI</span>
                </div>
                <span className={`font-semibold ${
                  (weather?.aqi ?? 0) >= 400 ? 'text-red-400' :
                  (weather?.aqi ?? 0) >= 200 ? 'text-orange-500' :
                  (weather?.aqi ?? 0) >= 100 ? 'text-yellow-500' : 'text-emerald-500'
                }`}>
                  {weather?.aqi != null ? `${weather.aqi} - ${weather.aqiCategory}` : '120 - Moderate'}
                  {(weather?.aqi ?? 0) >= 400 && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">TRIGGER</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Trigger Simulation
              </h3>
              <p className="text-sm text-slate-400">
                Demo: Simulate a disruption event to see auto-claim in action
              </p>
            </div>
            <button
              onClick={() => setShowSimulation(!showSimulation)}
              disabled={isSimulating}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {showSimulation ? 'Cancel' : 'Simulate Disruption'}
            </button>
          </div>

          {showSimulation && !isSimulating && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {disruptions.map((disruption) => {
                const coveredTriggers = Array.isArray(policy.coverage_triggers)
                  ? policy.coverage_triggers
                  : [];
                const mappedTrigger = TRIGGER_NAME_MAP[disruption.name] || disruption.name;
                const isCovered = coveredTriggers.includes(mappedTrigger);

                return (
                  <button
                    key={disruption.id}
                    onClick={() => startSimulation(disruption)}
                    disabled={!isCovered}
                    className={`border rounded-lg p-4 text-left transition-colors ${
                      isCovered
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        : 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-white font-semibold">
                        {disruption.name}
                      </div>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        {disruption.code}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-3">
                      Threshold: {disruption.threshold}
                    </div>
                    <div className="text-emerald-500 font-bold">
                      Payout: ₹{disruption.payout}
                    </div>
                    {!isCovered && (
                      <div className="text-xs text-slate-400 mt-2">
                        Not covered by current plan
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {isSimulating && selectedDisruption && (
            <div className="mt-6 bg-slate-800 rounded-lg p-6">
              <div className="space-y-4">
                {simulationSteps.map((step, index) => {
                  if (index >= simulationStep) return null;
                  // Compute the fraud score display inline
                  const fraudScore = computeFraudScore(worker!, claims);
                  const fraudStepMessage =
                    index === 3
                      ? `Fraud Score: ${fraudScore}/100 — ${fraudScore <= 30 ? 'AUTO APPROVED ✅' : fraudScore <= 60 ? 'SOFT REVIEW ⏳' : 'HOLD 🚫'}`
                      : step.message;

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-2xl">{step.icon}</span>
                      <div className="flex-1">
                        <p className="text-white">
                          {index === 0 && (
                            <>
                              <span className="font-semibold">{selectedDisruption.name}</span>{' '}
                              {step.message} in{' '}
                              <span className="font-semibold">{worker!.zone}</span>
                            </>
                          )}
                          {index === 5 && (
                            <>
                              <span className="font-semibold text-emerald-500">
                                ₹{selectedDisruption.payout}
                              </span>{' '}
                              {step.message}
                            </>
                          )}
                          {index !== 0 && index !== 5 && fraudStepMessage}
                        </p>
                        {index < simulationStep - 1 && (
                          <div className="w-full h-px bg-slate-700 mt-3" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fraud score legend */}
          {claims.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 flex items-center gap-4">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Score 0–30: Auto-approve</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> 31–60: Soft review (4h delay)</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> 61+: Hold for verification</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
