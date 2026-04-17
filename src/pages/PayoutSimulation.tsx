/**
 * PayoutSimulation.tsx
 * Full walkthrough of the parametric payout pipeline.
 * Fixes: stable transaction IDs, deterministic QR code, celebration animation.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  Zap,
  FileText,
  Lock,
  Coins,
  Smartphone,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface SimulationStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  details: string[];
  status: 'pending' | 'active' | 'complete';
}

const disruptions = [
  { id: 'T01', name: 'Heavy Rainfall (68mm in 6 hrs)', payout: 600,  emoji: '🌧️' },
  { id: 'T02', name: 'Extreme Heat (46°C)',             payout: 450,  emoji: '🔥' },
  { id: 'T03', name: 'Severe AQI (AQI 463)',            payout: 380,  emoji: '💨' },
  { id: 'T04', name: 'Flood Warning',                   payout: 800,  emoji: '🌊' },
  { id: 'T05', name: 'Curfew/Bandh',                   payout: 1000, emoji: '🚫' },
];

/** Deterministic transaction ID — stable across renders */
function makeTransactionId(disruption: string, workerPhone: string): string {
  const seed = `${disruption}-${workerPhone}`;
  const h = seed.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return `TXN-2026-${Math.abs(h).toString(36).toUpperCase().slice(0, 7)}`;
}

/** QR code grid — deterministic based on transaction ID */
function QRCode({ txnId }: { txnId: string }) {
  const cells = useMemo(() => {
    const grid: boolean[] = [];
    for (let i = 0; i < 64; i++) {
      const h = txnId.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0) + i * 31) | 0, 0);
      grid.push(Math.abs(h) % 3 !== 0);
    }
    return grid;
  }, [txnId]);

  return (
    <div className="w-36 h-36 bg-white rounded-lg p-3 mx-auto">
      <div className="grid grid-cols-8 gap-px h-full">
        {cells.map((filled, i) => (
          <div key={i} className={`rounded-sm ${filled ? 'bg-slate-900' : 'bg-white'}`} />
        ))}
      </div>
    </div>
  );
}

// Small helper so QRCode can use useMemo
import { useMemo } from 'react';

/** Confetti particle */
function Confetti() {
  const pieces = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      left: `${(i * 37) % 100}%`,
      color: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#a78bfa'][i % 5],
      delay: `${(i * 0.1) % 1.5}s`,
      duration: `${1.5 + (i % 5) * 0.3}s`,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 w-2.5 h-2.5 rounded-sm"
          style={{
            left: p.left,
            background: p.color,
            animationName: 'confetti-fall',
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationFillMode: 'forwards',
            animationTimingFunction: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default function PayoutSimulation() {
  const navigate = useNavigate();
  const { worker } = useAuth();
  const [selectedDisruption, setSelectedDisruption] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      elapsedRef.current += 100;
      setElapsed((e) => e + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    if (!isSimulating || !selectedDisruption) return;
    const stepTimings = [0, 1500, 3000, 4500, 6000, 7500];
    const timeouts = stepTimings.map((time, index) =>
      setTimeout(() => setCurrentStep(index), time)
    );
    const completeTimeout = setTimeout(() => {
      setIsSimulating(false);
      setShowReceipt(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 9000);
    return () => { timeouts.forEach(clearTimeout); clearTimeout(completeTimeout); };
  }, [isSimulating, selectedDisruption]);

  const selectedData = disruptions.find((d) => d.id === selectedDisruption);

  /** Stable transaction ID — computed once from disruption + worker, never changes */
  const transactionId = useMemo(
    () => (selectedDisruption && worker ? makeTransactionId(selectedDisruption, worker.phone || '0000') : ''),
    [selectedDisruption, worker]
  );

  const steps: SimulationStep[] = [
    {
      id: 'trigger',
      title: 'EVENT THRESHOLD BREACH DETECTED',
      icon: <Zap className="w-6 h-6" />,
      details: [
        selectedData ? `OpenWeatherMap: ${selectedData.name.split('(')[0].trim()}` : 'Detecting...',
        'Threshold: BREACHED',
        `Timestamp: ${new Date().toLocaleTimeString()}`,
      ],
      status: currentStep >= 0 ? (currentStep > 0 ? 'complete' : 'active') : 'pending',
    },
    {
      id: 'lookup',
      title: 'POLICY LOOKUP',
      icon: <FileText className="w-6 h-6" />,
      details: [
        `Worker: ${worker?.name ?? 'Worker'} (${worker?.partner_id ?? 'ID'})`,
        `Zone: ${worker?.zone ?? 'Zone'} | Platform: ${worker?.platform ?? 'Platform'}`,
        `Coverage: ✅ ${selectedData?.name.split('(')[0].trim() ?? 'Rain'} included`,
        `Max Payout: ₹${selectedData?.payout ?? 0}`,
      ],
      status: currentStep >= 1 ? (currentStep > 1 ? 'complete' : 'active') : 'pending',
    },
    {
      id: 'fraud',
      title: 'HEURISTIC ANOMALY VERIFICATION (L1–L5)',
      icon: <Lock className="w-6 h-6" />,
      details: [
        '✅ L1 Geospatial Corroboration — zone perimeter confirmed',
        '✅ L2 Telemetry Signal — sustained app usage verified',
        '✅ L3 Isolation Forest — 98% profile match',
        '✅ L4 Biometric Fingerprint — unique device identified',
        '✅ L5 Temporal Validation — pattern normality baseline met',
        `🟢 Fraud Score: ${currentStep >= 2 && Math.floor((new Date().getTime())/1000) % 2 === 0 ? '18/100' : '15/100'} — AUTO APPROVED`,
      ],
      status: currentStep >= 2 ? (currentStep > 2 ? 'complete' : 'active') : 'pending',
    },
    {
      id: 'calculation',
      title: 'DYNAMIC DISBURSEMENT CALCULATION',
      icon: <Coins className="w-6 h-6" />,
      details: [
        // ML Earnings validation is now exposed here
        `Declared earnings: ₹${Math.round((worker?.weekly_earnings ?? 4200) / 6)}/day`,
        `AI Zone Benchmark: ₹${['Koramangala', 'Banjara Hills', 'Connaught Place'].includes(worker?.zone ?? '') ? '850' : '650'}/day`,
        `ML Validation: Verified (92% confidence)`,
        'Disruption Impact: 7 of 8 working hours',
        `Computed Output: ₹${Math.round((worker?.weekly_earnings ?? 4200) / 6)} × 7/8`,
        `→ Final Payout: ₹${selectedData?.payout ?? 0}`,
      ],
      status: currentStep >= 3 ? (currentStep > 3 ? 'complete' : 'active') : 'pending',
    },
    {
      id: 'transfer',
      title: 'RAZORPAY FINTECH API INITIATED',
      icon: <Smartphone className="w-6 h-6" />,
      details: [
        'Payment Gateway: Razorpay (Test Mode)',
        `Transaction ID: ${transactionId}`,
        `UPI ID: xxxxxx${worker?.phone?.slice(-4) ?? '0000'}@upi`,
        `Amount: ₹${selectedData?.payout ?? 0}`,
        currentStep === 4 ? '⏳ Status: Processing...' : '✅ Status: Complete',
      ],
      status: currentStep >= 4 ? (currentStep > 4 ? 'complete' : 'active') : 'pending',
    },
    {
      id: 'complete',
      title: 'PAYOUT COMPLETE',
      icon: <Sparkles className="w-6 h-6" />,
      details: [
        `✅ ₹${selectedData?.payout ?? 0} credited to UPI successfully`,
        `⏱️ Total time: ${Math.floor(elapsed / 1000)}s`,
        `📱 SMS sent to +91-XXXXXX${worker?.phone?.slice(-4) ?? '0000'}`,
      ],
      status: currentStep >= 5 ? 'complete' : 'pending',
    },
  ];

  // ── Selection Screen ──
  if (!selectedDisruption && !showReceipt) {
    return (
      <div className="min-h-screen bg-gradient-hero">
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
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live System Demo</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              AI Payout Engine
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Watch the complete parametric pipeline — from trigger detection to ML fraud scoring to UPI credit — in real time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disruptions.map((disruption, i) => (
              <button
                key={disruption.id}
                onClick={() => {
                  setSelectedDisruption(disruption.id);
                  setIsSimulating(true);
                  setCurrentStep(0);
                  setElapsed(0);
                  elapsedRef.current = 0;
                  setShowReceipt(false);
                }}
                className="glass-card p-6 text-left hover-glow transition-all group animate-fade-in text-white"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <div className="text-3xl mb-3">{disruption.emoji}</div>
                <div className="text-xs font-bold text-emerald-400 mb-1">{disruption.id}</div>
                <div className="text-base font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors leading-tight">
                  {disruption.name}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-emerald-400">₹{disruption.payout}</div>
                    <div className="text-xs text-slate-400">Max Payout</div>
                  </div>
                  <Zap className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Simulation Running ──
  return (
    <div className="min-h-screen bg-gradient-hero">
      {showConfetti && <Confetti />}

      <nav className="nav-glass border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg glass-emerald flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">ShieldRoute</span>
          </div>
          {isSimulating && (
            <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Processing: {Math.floor(elapsed / 1000)}.{Math.floor((elapsed % 1000) / 100)}s
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showReceipt ? (
          <>
            <div className="text-center mb-10 animate-fade-in">
              <div className="text-4xl mb-3">{selectedData?.emoji}</div>
              <h2 className="text-2xl font-bold text-white">{selectedData?.name}</h2>
              <p className="text-slate-400 mt-1">Simulating full payout pipeline...</p>
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`border rounded-xl p-5 transition-all duration-500 ${
                    step.status === 'complete'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : step.status === 'active'
                      ? 'bg-slate-900 border-emerald-500 glow-emerald-sm'
                      : 'bg-slate-900/50 border-slate-800/50 opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                        step.status === 'complete'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : step.status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-600'
                      }`}
                      style={step.status === 'active' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}}
                    >
                      {step.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-white tracking-wide">{step.title}</h3>
                        {step.status === 'complete' && (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>

                      {step.status !== 'pending' && (
                        <div className="space-y-1">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="text-xs text-slate-300 font-mono">
                              └─ {detail}
                            </div>
                          ))}
                        </div>
                      )}

                      {step.status === 'active' && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 100}ms` }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ── Receipt ── */
          <div className="max-w-xl mx-auto animate-scale-in">
            <div className="card-gradient-border glow-emerald p-8 sm:p-12">
              <div className="bg-slate-900 rounded-2xl p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <Sparkles className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-emerald-400 mb-1">PAYOUT CONFIRMED</h2>
                  <p className="text-slate-400 text-sm">Instant UPI transfer completed</p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    ['Transaction ID', transactionId, 'font-mono text-xs'],
                    ['Worker',         `${worker?.name ?? 'Worker'} (${worker?.partner_id ?? 'ID'})`, ''],
                    ['Zone',           worker?.zone ?? '—', ''],
                    ['Trigger Event',  selectedData?.name ?? '—', ''],
                    ['Processing Time', `${Math.floor(elapsed / 1000)}.${Math.floor((elapsed % 1000) / 100)}s`, 'font-mono'],
                  ].map(([label, value, extra]) => (
                    <div key={label as string} className="flex justify-between items-center py-2.5 border-b border-slate-800">
                      <span className="text-sm text-slate-400">{label}</span>
                      <span className={`text-sm text-white text-right ${extra}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-bold text-slate-300">Payout Amount</span>
                    <span className="text-3xl font-black text-emerald-400">₹{selectedData?.payout}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-6 text-center">
                  <p className="text-xs text-slate-500 mb-3">Scan to verify payout receipt</p>
                  <QRCode txnId={transactionId} />
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="w-5 h-5 bg-[#02042B] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-[9px]">₹z</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">Powered by Razorpay <span className="text-[#0089E4] font-bold">UPI</span></span>
                  <span className="text-[10px] bg-[#0089E4]/20 text-[#0089E4] px-2 py-0.5 rounded-full border border-[#0089E4]/30 ml-2">SIMULATION</span>
                </div>

                <p className="text-center text-xs text-slate-600 mb-6">
                  Simulated payout for demo purposes — not a real financial transaction
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReceipt(false);
                      setSelectedDisruption(null);
                      setCurrentStep(0);
                      setElapsed(0);
                      elapsedRef.current = 0;
                    }}
                    className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Simulation
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 btn-primary py-3"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
