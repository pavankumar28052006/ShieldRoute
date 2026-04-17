/**
 * Onboarding.tsx
 * Worker registration — phone OTP → profile → risk score reveal.
 * Demo Mode: uses Supabase anonymous auth to bypass phone OTP for hackathon demos.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, User, MapPin, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { computeMLRiskScore, MLRiskResult } from '../lib/aiEngine';

const zones = ['Koramangala', 'Banjara Hills', 'Andheri', 'Connaught Place', 'T Nagar'];

const STEP_LABELS = ['Phone Verify', 'Your Details', 'Review'];

const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors';

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [phone,           setPhone]          = useState('');
  const [otp,             setOtp]            = useState('');
  const [otpSent,         setOtpSent]        = useState(false);
  const [otpLoading,      setOtpLoading]     = useState(false);
  const [otpError,        setOtpError]       = useState('');
  const [showDemoPrompt,  setShowDemoPrompt] = useState(false);
  const [demoLoading,     setDemoLoading]    = useState(false);

  const [name,           setName]           = useState('');
  const [partnerId,      setPartnerId]      = useState('');
  const [platform,       setPlatform]       = useState('Zomato');
  const [zone,           setZone]           = useState('');
  const [weeklyEarnings, setWeeklyEarnings] = useState(4000);

  const [riskScore,     setRiskScore]     = useState(0);
  const [showRiskScore, setShowRiskScore] = useState(false);
  const [riskResult,    setRiskResult]    = useState<MLRiskResult | null>(null);

  const normalizePhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.startsWith('91') && d.length === 12) return `+${d}`;
    if (d.length === 10) return `+91${d}`;
    if (d.startsWith('0') && d.length === 11) return `+91${d.slice(1)}`;
    return '';
  };

  /** OTP-less anonymous login for hackathon demo / SMS-disabled environments */
  const enterDemoMode = async () => {
    setDemoLoading(true);
    setOtpError('');
    const { error } = await supabase.auth.signInAnonymously();
    setDemoLoading(false);
    if (error) {
      setOtpError('Demo Mode failed. Please enable Anonymous Auth in Supabase dashboard.');
      return;
    }
    toast.success('Demo Mode active', 'Phone verification bypassed for demo.');
    setStep(2);
  };

  const sendOtp = async () => {
    setOtpError('');
    setShowDemoPrompt(false);
    const norm = normalizePhone(phone);
    if (!norm) { setOtpError('Enter a valid 10-digit Indian mobile number.'); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: norm });
    setOtpLoading(false);
    if (error) {
      // Show demo bypass option on any Supabase phone-auth error
      setOtpError(error.message || 'Unable to send OTP.');
      setShowDemoPrompt(true);
      return;
    }
    setOtpSent(true);
    toast.success('OTP Sent', `Verification code sent to ${norm}`);
  };

  const verifyOtp = async () => {
    setOtpError('');
    const norm = normalizePhone(phone);
    if (!norm) { setOtpError('Invalid phone number. Please re-enter.'); return; }
    if (otp.length !== 6) { setOtpError('OTP must be exactly 6 digits.'); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: norm, token: otp, type: 'sms' });
    setOtpLoading(false);
    if (error) { setOtpError(error.message || 'OTP verification failed.'); return; }
    setStep(2);
  };

  const submitOnboarding = async () => {
    setLoading(true);
    
    // Use ML Engine
    const mlResult = computeMLRiskScore({ zone, weekly_earnings: weeklyEarnings, platform, created_at: new Date().toISOString() });
    
    setRiskScore(mlResult.totalScore);
    setRiskResult(mlResult);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;

    if (authError || !authUserId) {
      setLoading(false);
      toast.error('Session Error', 'Session unavailable. Please refresh and try again.');
      return;
    }

    // Use entered phone if available, otherwise use a demo placeholder
    const phoneValue = normalizePhone(phone) || `demo-${authUserId.slice(0, 8)}`;

    const { data, error } = await supabase
      .from('workers')
      .insert({
        id:              authUserId,
        phone:           phoneValue,
        name,
        partner_id:      partnerId,
        platform,
        zone,
        weekly_earnings: weeklyEarnings,
        risk_score:      mlResult.totalScore,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error('Registration Failed', 'Error creating account. Please try again.');
      return;
    }

    setShowRiskScore(true);
    setTimeout(() => navigate('/plans', { state: { worker: data } }), 6000);
  };

  const getRiskLabel = (score: number) => {
    if (score < 60) return { label: 'Low Risk',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score < 75) return { label: 'Medium Risk', color: 'text-yellow-400',  bg: 'bg-yellow-500/10  border-yellow-500/30' };
    return               { label: 'High Risk',    color: 'text-red-400',     bg: 'bg-red-500/10     border-red-500/30' };
  };

  const riskInfo = getRiskLabel(riskScore);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-indigo-500/6 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl glass-emerald flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ShieldRoute</h1>
          <p className="text-slate-400 text-sm mt-1">Get protected in minutes</p>
        </div>

        <div className="glass-card p-8">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        s < step  ? 'bg-emerald-500 text-white' :
                        s === step ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' :
                        'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {s < step ? '✓' : s}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:block ${s === step ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                  {s < 3 && (
                    <div className={`w-12 sm:w-16 h-0.5 mx-2 transition-all duration-500 ${s < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Step 1 — Phone OTP ── */}
          {step === 1 && (
            <div className="animate-fade-in-fast">
              <h2 className="text-xl font-bold text-white mb-6">Verify Your Phone</h2>
              <div className="space-y-4">

                {/* Demo Mode Banner — always visible at top */}
                <button
                  id="demo-mode-btn"
                  onClick={enterDemoMode}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-500/80 rounded-xl px-4 py-3.5 transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-400">Demo Mode — Skip Phone Verify</div>
                      <div className="text-xs text-slate-400">For hackathon judges &amp; evaluators</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500 font-medium">or use real OTP</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      disabled={otpSent}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="animate-fade-in-fast">
                    <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit OTP</label>
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className={`${inputClass} tracking-widest text-center text-lg`}
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Sent to {normalizePhone(phone) || phone}</p>
                  </div>
                )}

                {/* Error with optional demo prompt */}
                {otpError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{otpError}</p>
                    </div>
                    {showDemoPrompt && (
                      <button
                        onClick={enterDemoMode}
                        disabled={demoLoading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-sm font-semibold rounded-lg py-2.5 transition-all disabled:opacity-60"
                      >
                        <Zap className="w-4 h-4" />
                        {demoLoading ? 'Entering demo...' : 'Switch to Demo Mode instead'}
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={otpSent ? verifyOtp : sendOtp}
                  disabled={otpLoading || !phone || (otpSent && otp.length !== 6)}
                  className="btn-secondary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {otpLoading
                    ? (otpSent ? 'Verifying...' : 'Sending...')
                    : otpSent
                    ? 'Verify OTP'
                    : 'Send OTP'}
                  {!otpLoading && <ChevronRight className="w-4 h-4" />}
                </button>

                {otpSent && (
                  <button
                    onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); setShowDemoPrompt(false); }}
                    className="text-center w-full text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Change phone number
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2 — Profile ── */}
          {step === 2 && (
            <div className="animate-fade-in-fast">
              <h2 className="text-xl font-bold text-white mb-6">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ravi Kumar"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
                  <select
                    id="platform-select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Partner ID</label>
                  <input
                    id="partner-id-input"
                    type="text"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    placeholder="ZOM-BLR-2847"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Delivery Zone</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="zone-select"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className={`${inputClass} pl-10`}
                    >
                      <option value="">Select zone</option>
                      {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Weekly Earnings:{' '}
                    <span className="text-emerald-400 font-bold">₹{weeklyEarnings.toLocaleString('en-IN')}</span>
                  </label>
                  <input
                    type="range"
                    min="3500"
                    max="7000"
                    step="100"
                    value={weeklyEarnings}
                    onChange={(e) => setWeeklyEarnings(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹3,500</span><span>₹7,000</span>
                  </div>
                </div>

                <button
                  id="continue-btn"
                  onClick={() => setStep(3)}
                  disabled={!name || !partnerId || !zone}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Review & Submit ── */}
          {step === 3 && !showRiskScore && (
            <div className="animate-fade-in-fast">
              <h2 className="text-xl font-bold text-white mb-6">Review &amp; Submit</h2>
              <div className="bg-slate-800 rounded-xl p-4 space-y-3 mb-6">
                {[
                  ['Name',            name],
                  ['Platform',        platform],
                  ['Partner ID',      partnerId],
                  ['Zone',            zone],
                  ['Weekly Earnings', `₹${weeklyEarnings.toLocaleString('en-IN')}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1.5 border-b border-slate-700/50 last:border-0">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">
                  Edit
                </button>
                <button
                  id="submit-onboarding-btn"
                  onClick={submitOnboarding}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          {/* ── Risk Score Reveal ── */}
          {showRiskScore && riskResult && (
            <div className="text-left space-y-6 animate-scale-in py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl glass-emerald flex items-center justify-center mx-auto mb-3 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">AI Risk Engine Analysis</h3>
                <p className="text-slate-400 text-sm mb-6">Multi-factor profile evaluation complete</p>
              </div>

              {/* Top Level Score */}
              <div className="flex items-center gap-6 bg-slate-800 border border-slate-700 p-5 rounded-xl">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="#1e293b" strokeWidth="12" />
                    <circle
                      cx="72" cy="72" r="60" fill="none"
                      strokeWidth="12"
                      stroke={riskScore < 60 ? '#10b981' : riskScore < 75 ? '#f59e0b' : '#ef4444'}
                      strokeLinecap="round"
                      strokeDasharray={`${(riskScore / 100) * 377} 377`}
                      style={{ transition: 'stroke-dasharray 1.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${riskInfo.color}`}>{riskScore}</span>
                  </div>
                </div>
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold mb-2 ${riskInfo.bg} ${riskInfo.color}`}>
                    {riskInfo.label}
                  </div>
                  <p className="text-sm text-slate-300">Base profile risk computed dynamically across 5 zone and behavioral factors.</p>
                </div>
              </div>

              {/* ML Features Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" /> Feature Importances
                </h4>
                <div className="space-y-3">
                  {riskResult.features.map((feature, i) => (
                    <div key={feature.name} className="bg-slate-900 border border-slate-800 rounded-lg p-3 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white font-medium">{feature.name}</span>
                        <span className={`text-xs font-bold ${feature.impact === 'negative' ? 'text-orange-400' : feature.impact === 'positive' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {feature.weight}% Weight
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                        <div className={`h-1.5 rounded-full ${feature.impact === 'negative' ? 'bg-orange-500' : feature.impact === 'positive' ? 'bg-emerald-500' : 'bg-slate-500'}`} style={{ width: `${feature.score}%` }} />
                      </div>
                      <p className="text-xs text-slate-400">{feature.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Validation (Ridge Regression Mock) */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mt-4 animate-slide-up" style={{ animationDelay: '500ms' }}>
                <h4 className="text-sm font-bold text-white mb-3">AI Earnings Validation</h4>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="text-xs text-slate-400">Declared</div>
                    <div className="text-white font-semibold">₹{riskResult.earningsValidation.declared}/day</div>
                  </div>
                  <div className="flex-1 px-4 text-center text-xs text-blue-400 font-medium">vs</div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Zone Benchmark</div>
                    <div className="text-white font-semibold">₹{riskResult.earningsValidation.benchmarkDaily}/day</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-500/20 mt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-300">Validation Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${riskResult.earningsValidation.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                    {riskResult.earningsValidation.status} ({riskResult.earningsValidation.confidence}% conf.)
                  </span>
                </div>
              </div>

              <p className="text-center text-emerald-400 text-sm font-bold mt-4 animate-pulse">
                Redirecting to dynamic plan selection...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
