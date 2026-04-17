/**
 * Dashboard.tsx
 * Worker dashboard — live weather, policy status, claim simulation, and payout history.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Policy, Claim } from '../lib/supabase';
import { getWeatherForZone, checkActiveTriggers, WeatherData, ActiveTrigger } from '../lib/weather';
import { useToast } from '../components/Toast';
import { SkeletonCard, SkeletonRow, SkeletonWeatherRow } from '../components/LoadingSpinner';
import { KPICard } from '../components/ui/KPICard';
import { computeL1toL5FraudScore } from '../lib/aiEngine';

interface DisruptionType {
  id: string;
  name: string;
  code: string;
  threshold: string;
  payout: number;
}

const disruptions: DisruptionType[] = [
  { id: 'T01', name: 'Heavy Rainfall', code: 'T01', threshold: '68mm in 6 hrs', payout: 600 },
  { id: 'T02', name: 'Extreme Heat',   code: 'T02', threshold: '46°C',           payout: 450 },
  { id: 'T03', name: 'Severe AQI',     code: 'T03', threshold: 'AQI 463',        payout: 380 },
  { id: 'T04', name: 'Flood Warning',  code: 'T04', threshold: 'Govt Alert',     payout: 800 },
  { id: 'T05', name: 'Curfew/Bandh',   code: 'T05', threshold: 'Civic Decl.',    payout: 1000 },
];

const TRIGGER_NAME_MAP: Record<string, string> = {
  'Heavy Rainfall': 'Rain',
  'Extreme Heat':   'Heat',
  'Severe AQI':     'AQI',
  'Flood Warning':  'Flood',
  'Curfew/Bandh':   'Curfew',
};

const DISRUPTION_EMOJIS: Record<string, string> = {
  T01: '🌧️', T02: '🔥', T03: '💨', T04: '🌊', T05: '🚫',
};

interface SimulationStep {
  message: string;
  icon: string;
}



export default function Dashboard() {
  const { worker, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [policy,  setPolicy]  = useState<Policy | null>(null);
  const [claims,  setClaims]  = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSimulation,    setShowSimulation]    = useState(false);
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionType | null>(null);
  const [simulationStep,    setSimulationStep]    = useState(0);
  const [isSimulating,      setIsSimulating]      = useState(false);

  const [weather,        setWeather]        = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [autoClaimNotices, setAutoClaimNotices] = useState<string[]>([]);

  const simulationSteps: SimulationStep[] = [
    { message: 'Trigger Detected — threshold breached',    icon: '🔍' },
    { message: 'Cross-referencing active policies in zone...', icon: '📋' },
    { message: 'Running fraud validation stack (L1–L4)...', icon: '🛡️' },
    { message: '', icon: '✅' },
    { message: 'Initiating UPI payout to worker...',       icon: '💸' },
    { message: 'credited to UPI ID successfully!',         icon: '🎉' },
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

  const loadWeather = useCallback(async () => {
    if (!worker) return;
    setWeatherLoading(true);
    const data = await getWeatherForZone(worker.zone);
    setWeather(data);
    setWeatherLoading(false);
  }, [worker]);

  useEffect(() => {
    if (!worker) { navigate('/onboard'); return; }
    loadData();
    loadWeather();
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [worker, navigate, loadData, loadWeather]);

  const startSimulation = async (disruption: DisruptionType) => {
    if (!policy || !worker) return;

    const coveredTriggers = Array.isArray(policy.coverage_triggers) ? policy.coverage_triggers : [];
    const mappedTrigger   = TRIGGER_NAME_MAP[disruption.name] || disruption.name;
    const isCovered       = coveredTriggers.includes(mappedTrigger);

    if (!isCovered) {
      toast.warning('Not Covered', `${disruption.name} is not included in your current plan.`);
      return;
    }

    setSelectedDisruption(disruption);
    setIsSimulating(true);
    setSimulationStep(0);
    setShowSimulation(false);

    const accountAgeDays = Math.floor((Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const mlFraud = computeL1toL5FraudScore(worker.id, claims.length, accountAgeDays);
    const fraudScore = mlFraud.totalScore;

    for (let i = 0; i < simulationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSimulationStep(i + 1);
    }

    const { data: newClaim } = await supabase
      .from('claims')
      .insert({
        worker_id:    worker.id,
        policy_id:    policy.id,
        trigger_type: disruption.code,
        trigger_name: disruption.name,
        amount:       disruption.payout,
        status: fraudScore <= 30 ? 'approved' : fraudScore <= 60 ? 'pending' : 'rejected',
        fraud_score: fraudScore,
        fraud_flags: mlFraud.layerScores,
      })
      .select()
      .single();

    if (newClaim) {
      setClaims([newClaim, ...claims]);
      toast.success('Claim created', `₹${disruption.payout} payout initiated for ${disruption.name}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSimulating(false);
    setSimulationStep(0);
    setSelectedDisruption(null);
  };

  const autoInitiateClaims = useCallback(
    async (triggers: ActiveTrigger[]) => {
      if (!policy || !worker || triggers.length === 0) return;

      const dedupeWindowStart = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const createdClaims: Claim[] = [];
      const notices: string[] = [];

      for (const trigger of triggers) {
        const disruption = disruptions.find((d) => d.code === trigger.code);
        if (!disruption) continue;

        const { data: existingClaims } = await supabase
          .from('claims')
          .select('id')
          .eq('worker_id', worker.id)
          .eq('policy_id', policy.id)
          .eq('trigger_type', trigger.code)
          .gte('created_at', dedupeWindowStart)
          .limit(1);

        if (existingClaims && existingClaims.length > 0) continue;

        const accountAgeDays = Math.floor((Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const mlFraud = computeL1toL5FraudScore(worker.id, claims.length + createdClaims.length, accountAgeDays);
        const fraudScore = mlFraud.totalScore;
        
        const { data: newClaim } = await supabase
          .from('claims')
          .insert({
            worker_id:    worker.id,
            policy_id:    policy.id,
            trigger_type: trigger.code,
            trigger_name: trigger.name,
            amount:       disruption.payout,
            status: fraudScore <= 30 ? 'approved' : fraudScore <= 60 ? 'pending' : 'rejected',
            fraud_score: fraudScore,
            fraud_flags: mlFraud.layerScores,
          })
          .select()
          .single();

        if (newClaim) {
          createdClaims.push(newClaim);
          notices.push(`${trigger.code} claim auto-initiated: ₹${disruption.payout}`);
        }
      }

      if (createdClaims.length > 0) {
        setClaims((prev) => [...createdClaims, ...prev]);
        setAutoClaimNotices((prev) => [...notices, ...prev].slice(0, 3));
      }
    },
    [policy, worker, claims]
  );

  const getRiskLabel = (score: number) => {
    if (score < 60) return { label: 'Low',    color: 'text-emerald-400 bg-emerald-500/10' };
    if (score < 75) return { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10' };
    return              { label: 'High',   color: 'text-red-400 bg-red-500/10' };
  };

  const getDaysRemaining = () => {
    if (!policy) return 0;
    const diff = new Date(policy.end_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTotalPayouts = () => claims.reduce((sum, c) => sum + c.amount, 0);

  const fraudLabel = (score: number) => {
    if (score <= 30) return { text: `${score}/100 — AUTO APPROVED`, color: 'text-emerald-400' };
    if (score <= 60) return { text: `${score}/100 — SOFT REVIEW`,   color: 'text-yellow-400' };
    return               { text: `${score}/100 — HOLD`,            color: 'text-red-400' };
  };

  const activeTriggers = React.useMemo(() => {
    return weather && policy
      ? checkActiveTriggers(weather, Array.isArray(policy.coverage_triggers) ? policy.coverage_triggers : [])
      : [];
  }, [weather, policy]);

  // Track whether auto-claim has been attempted for current trigger set
  const autoClaimAttempted = useRef(false);
  useEffect(() => {
    if (activeTriggers.length === 0) { autoClaimAttempted.current = false; return; }
    if (autoClaimAttempted.current) return;
    autoClaimAttempted.current = true;
    autoInitiateClaims(activeTriggers);
  }, [activeTriggers, autoInitiateClaims]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <nav className="nav-glass border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold text-white">ShieldRoute</span>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton h-8 w-48 rounded-lg mb-2" />
          <div className="skeleton h-5 w-64 rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              {[...Array(4)].map((_, i) => <SkeletonWeatherRow key={i} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center glass-card p-12 max-w-sm w-full mx-4 animate-scale-in">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">No Active Policy</p>
          <p className="text-slate-400 text-sm mb-6">Choose a plan to start protecting your income.</p>
          <button
            onClick={() => navigate('/plans')}
            className="btn-primary w-full py-3"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const riskData   = getRiskLabel(worker!.risk_score);
  const daysLeft   = getDaysRemaining();
  const daysTotal  = policy.weeks_covered * 7;
  const progressPct = Math.max(0, Math.min(100, ((daysTotal - daysLeft) / daysTotal) * 100));

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* ── Nav ── */}
      <nav className="nav-glass border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg glass-emerald flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">ShieldRoute</span>
            <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider">
              <Zap className="w-3 h-3" /> AI ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={() => navigate('/simulate')}
              className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Simulate
            </button>
            <button
              onClick={() => navigate('/claims')}
              className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Claims
            </button>
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span className="gradient-text">{worker!.name}</span>
          </h1>
          <p className="text-slate-400">
            Zone: <span className="text-slate-300">{worker!.zone}</span>
            {' · '}Risk:{' '}
            <span className={`font-semibold ${riskData.color.split(' ')[0]}`}>
              {riskData.label} ({worker!.risk_score}/100)
            </span>
          </p>
        </div>

        {/* ── Active Trigger Alerts ── */}
        {activeTriggers.length > 0 && (
          <div className="mb-6 space-y-2 animate-fade-in">
            {activeTriggers.map((t) => (
              <div
                key={t.code}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-xl p-4 animate-border-pulse"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-400">{t.code} — {t.name} threshold met</span>
                  <span className="text-slate-300 text-sm ml-2">
                    {t.value} (threshold {t.threshold}) · Auto-claim initiated
                  </span>
                </div>
              </div>
            ))}
            {autoClaimNotices.map((notice) => (
              <div
                key={notice}
                className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-300">{notice}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Active Policy Card ── */}
        <div className="card-gradient-border animate-border-pulse mb-8 glow-emerald-sm animate-fade-in">
          <div className="bg-slate-900 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">{policy.plan_type} Plan</h2>
                  <span className="badge bg-emerald-500 text-white">ACTIVE</span>
                </div>
                <p className="text-slate-400 text-sm">
                  ₹{policy.final_premium}/week · Max Payout: ₹{policy.max_payout.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-400 stat-number">{daysLeft}</div>
                <div className="text-xs text-slate-400">days remaining</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar mb-4">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="flex flex-wrap gap-2">
              {(policy.coverage_triggers as string[]).map((trigger) => (
                <span key={trigger} className="badge bg-slate-800 text-slate-300 border border-slate-700">
                  {trigger}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-500/10"
            value={policy.weeks_covered}
            label="Weeks Covered"
          />
          <KPICard
            icon={<DollarSign className="w-5 h-5 text-purple-400" />}
            iconBg="bg-purple-500/10"
            value={`₹${policy.total_premium_paid}`}
            label="Premium Paid"
          />
          <KPICard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            value={`₹${getTotalPayouts().toLocaleString('en-IN')}`}
            label="Total Payouts"
            valueColor="text-emerald-400"
          />
          <KPICard
            icon={<Activity className="w-5 h-5" />}
            iconBg={riskData.color}
            value={riskData.label}
            label="Risk Level"
            valueColor={riskData.color.split(' ')[0]}
          />
        </div>

        {/* ── Two columns: Payouts + Weather ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Recent Payouts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Recent Payouts</h3>
              {claims.length > 0 && (
                <button
                  onClick={() => navigate('/claims')}
                  className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {claims.length > 0 ? (
              <div className="space-y-3">
                {claims.slice(0, 3).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between bg-slate-800 rounded-lg p-4 table-row-hover"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{DISRUPTION_EMOJIS[claim.trigger_type] || '⚡'}</span>
                        <span className="text-white font-semibold text-sm">{claim.trigger_name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(claim.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className={`text-xs mt-1 font-semibold ${fraudLabel(claim.fraud_score).color} flex items-center gap-1`}>
                        {fraudLabel(claim.fraud_score).text}
                      </div>

                      {/* Mini AI breakdown */}
                      <div className="flex gap-1 mt-2">
                        {['L1', 'L2', 'L3', 'L4', 'L5'].map((l, i) => {
                           const lScore = Object.values(claim.fraud_flags || {})[i] as number || 0;
                           const color = lScore > 60 ? 'bg-red-500' : lScore > 30 ? 'bg-yellow-500' : 'bg-emerald-500';
                           return (
                             <div key={l} className="flex flex-col items-center gap-0.5" title={`${l} layer score`}>
                               <div className="w-6 h-1 rounded-full bg-slate-700/50">
                                 <div className={`h-1 rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, lScore))}%` }} />
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">₹{claim.amount}</div>
                      <div className={`text-xs mt-1 badge ${
                        claim.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        claim.status === 'pending'  ? 'bg-yellow-500/10  text-yellow-400'  :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {claim.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm">No payouts yet</p>
                <p className="text-slate-600 text-xs mt-1">Payouts appear automatically when triggers fire</p>
              </div>
            )}
          </div>

          {/* Live Zone Weather */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Live Zone Status</h3>
              <span className="flex items-center gap-1.5 text-xs">
                {weatherLoading ? (
                  <span className="text-slate-500 animate-pulse">Fetching...</span>
                ) : weather?.isLive ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="text-slate-500">DEMO DATA</span>
                )}
              </span>
            </div>
            {weatherLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <SkeletonWeatherRow key={i} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    icon: <Cloud className="w-4 h-4 text-blue-400" />,
                    label: 'Weather',
                    value: weather?.description ?? 'Clear',
                    color: weather?.description === 'Clear' ? 'text-emerald-400' : 'text-yellow-400',
                    trigger: false,
                  },
                  {
                    icon: <Droplets className="w-4 h-4 text-blue-400" />,
                    label: 'Rainfall',
                    value: `${weather?.rainfall_mm?.toFixed(1) ?? 0}mm/hr`,
                    color: (weather?.rainfall_mm ?? 0) >= 35 ? 'text-red-400' : 'text-slate-300',
                    trigger: (weather?.rainfall_mm ?? 0) >= 35,
                  },
                  {
                    icon: <Thermometer className="w-4 h-4 text-orange-400" />,
                    label: 'Temperature',
                    value: `${weather?.temperature_c ?? 28}°C`,
                    color: (weather?.temperature_c ?? 0) >= 44 ? 'text-red-400' : 'text-slate-300',
                    trigger: (weather?.temperature_c ?? 0) >= 44,
                  },
                  {
                    icon: <Wind className="w-4 h-4 text-slate-400" />,
                    label: 'AQI',
                    value: `${weather?.aqi ?? 120} — ${weather?.aqiCategory ?? 'Moderate'}`,
                    color: (weather?.aqi ?? 0) >= 400 ? 'text-red-400' : (weather?.aqi ?? 0) >= 200 ? 'text-orange-400' : 'text-slate-300',
                    trigger: (weather?.aqi ?? 0) >= 400,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between rounded-lg p-3.5 ${
                      row.trigger ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {row.icon}
                      <span className="text-sm text-white">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                      {row.trigger && (
                        <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">TRIGGER</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Trigger Simulation Panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-white">Trigger Simulation</h3>
              <p className="text-sm text-slate-400 mt-1">
                Demo: test the full auto-claim pipeline for your covered triggers
              </p>
            </div>
            <button
              onClick={() => setShowSimulation(!showSimulation)}
              disabled={isSimulating}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                showSimulation
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'btn-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {showSimulation ? 'Cancel' : 'Simulate Disruption'}
            </button>
          </div>

          {showSimulation && !isSimulating && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
              {disruptions.map((disruption) => {
                const coveredTriggers = Array.isArray(policy.coverage_triggers) ? policy.coverage_triggers : [];
                const mappedTrigger  = TRIGGER_NAME_MAP[disruption.name] || disruption.name;
                const isCovered      = coveredTriggers.includes(mappedTrigger);

                return (
                  <button
                    key={disruption.id}
                    onClick={() => startSimulation(disruption)}
                    disabled={!isCovered}
                    className={`rounded-xl p-4 text-left transition-all ${
                      isCovered
                        ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 hover-glow'
                        : 'bg-slate-900 border border-slate-800 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{DISRUPTION_EMOJIS[disruption.code]}</span>
                      <span className="badge bg-slate-700 text-slate-300 text-[10px]">{disruption.code}</span>
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">{disruption.name}</div>
                    <div className="text-xs text-slate-400 mb-3">Threshold: {disruption.threshold}</div>
                    <div className="text-emerald-400 font-bold">₹{disruption.payout}</div>
                    {!isCovered && <div className="text-xs text-slate-500 mt-1">Not in your plan</div>}
                  </button>
                );
              })}
            </div>
          )}

          {isSimulating && selectedDisruption && (
            <div className="mt-6 space-y-3">
              {simulationSteps.map((step, index) => {
                if (index >= simulationStep) return null;
                const accountAgeDays = Math.floor((Date.now() - new Date(worker!.created_at).getTime()) / (1000 * 60 * 60 * 24));
                const mlFraud = computeL1toL5FraudScore(worker!.id, claims.length, accountAgeDays);
                const fraudScore = mlFraud.totalScore;
                
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 bg-slate-800 rounded-lg p-5 animate-fade-in-fast border border-slate-700/50 shadow-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm leading-relaxed mb-1 mt-1 font-medium">
                        {index === 0 && (
                          <>
                            <span className="font-bold text-white">{selectedDisruption.name}</span>{' '}
                            {step.message} in{' '}
                            <span className="font-bold text-emerald-400">{worker!.zone}</span>
                          </>
                        )}
                        {index === 5 && (
                          <>
                            <span className="font-bold text-emerald-400">₹{selectedDisruption.payout}</span>{' '}
                            {step.message}
                          </>
                        )}
                        {index !== 0 && index !== 5 && index !== 3 && step.message}
                        {index === 3 && (
                           <>Fraud Score: <span className={fraudScore <= 30 ? 'text-emerald-400' : fraudScore <= 60 ? 'text-yellow-400' : 'text-red-400'}>{fraudScore}/100 — {fraudScore <= 30 ? 'AUTO APPROVED ✅' : fraudScore <= 60 ? 'SOFT REVIEW ⏳' : 'HOLD 🚫'}</span></>
                        )}
                      </p>

                      {/* L1-L5 Detailed view on step 3 */}
                      {index === 3 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-700">
                           {[
                             { label: 'L1 GPS', val: mlFraud.layerScores.L1_GPS },
                             { label: 'L2 Act.', val: mlFraud.layerScores.L2_Activity },
                             { label: 'L3 Anm.', val: mlFraud.layerScores.L3_Anomaly },
                             { label: 'L4 Dup.', val: mlFraud.layerScores.L4_Duplicate },
                             { label: 'L5 Hist.', val: mlFraud.layerScores.L5_History }
                           ].map(l => (
                             <div key={l.label}>
                               <div className="text-[10px] text-slate-400 mb-1">{l.label}</div>
                               <div className="w-full bg-slate-700 rounded-full h-1">
                                 <div className={`h-1 rounded-full ${l.val > 60 ? 'bg-red-500' : l.val > 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${l.val}%` }} />
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    {index < simulationStep - 1 && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-2" />}
                  </div>
                );
              })}

              {simulationStep < simulationSteps.length && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm pl-4">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200" />
                  </div>
                  Processing...
                </div>
              )}
            </div>
          )}

          {/* Fraud score legend */}
          {claims.length > 0 && !isSimulating && !showSimulation && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Score 0–30: Auto-approve
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" /> 31–60: Soft review (4h delay)
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" /> 61+: Hold for verification
                </span>
              </p>
            </div>
          )}

          {!isSimulating && !showSimulation && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/simulate')}
                className="flex items-center gap-2 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Full payout simulation walkthrough
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
