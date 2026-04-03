import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  ArrowLeft,
  Download,
  CheckCircle,
  Zap,
  FileText,
  Lock,
  Coins,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface SimulationStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  details: string[];
  status: 'pending' | 'active' | 'complete';
  time: number;
}

const disruptions = [
  { id: 'T01', name: 'Heavy Rainfall (68mm in 6 hrs)', payout: 600 },
  { id: 'T02', name: 'Extreme Heat (46°C)', payout: 450 },
  { id: 'T03', name: 'Severe AQI (AQI 463)', payout: 380 },
  { id: 'T04', name: 'Flood Warning', payout: 800 },
  { id: 'T05', name: 'Curfew/Bandh', payout: 1000 },
];

export default function PayoutSimulation() {
  const navigate = useNavigate();
  const { worker } = useAuth();
  const [selectedDisruption, setSelectedDisruption] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setElapsed((e) => e + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    if (!isSimulating || !selectedDisruption) return;

    const stepTimings = [0, 1500, 3000, 4500, 6000, 7500];
    const timeouts = stepTimings.map((time, index) =>
      setTimeout(() => {
        setCurrentStep(index);
      }, time)
    );

    const completeTimeout = setTimeout(() => {
      setIsSimulating(false);
      setShowReceipt(true);
    }, 9000);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      clearTimeout(completeTimeout);
    };
  }, [isSimulating, selectedDisruption]);

  const selectedDisruptionData = disruptions.find((d) => d.id === selectedDisruption);

  const steps: SimulationStep[] = [
    {
      id: 'trigger',
      title: 'TRIGGER DETECTED',
      icon: <Zap className="w-6 h-6" />,
      details: [
        selectedDisruptionData
          ? `OpenWeatherMap: ${selectedDisruptionData.name.split('(')[0].trim()}`
          : 'Detecting disruption...',
        'Threshold: BREACHED',
        `Timestamp: ${new Date().toLocaleTimeString()}`,
      ],
      status: currentStep >= 0 ? (currentStep > 0 ? 'complete' : 'active') : 'pending',
      time: 0,
    },
    {
      id: 'lookup',
      title: 'POLICY LOOKUP',
      icon: <FileText className="w-6 h-6" />,
      details: [
        `Worker: ${worker?.name || 'Worker'} (${worker?.partner_id || 'ID'})`,
        `Plan: Standard | Zone: ${worker?.zone || 'Zone'}`,
        `Coverage: ✅ ${selectedDisruptionData?.name.split('(')[0].trim() || 'Rain'} included`,
        `Max Payout: ₹${selectedDisruptionData?.payout || 0}`,
      ],
      status: currentStep >= 1 ? (currentStep > 1 ? 'complete' : 'active') : 'pending',
      time: 1500,
    },
    {
      id: 'fraud',
      title: 'FRAUD VALIDATION',
      icon: <Lock className="w-6 h-6" />,
      details: [
        '✅ L1 GPS Zone Check',
        '✅ L2 Activity Signal',
        '✅ L3 Anomaly Detection',
        '✅ L4 Duplicate Check',
        '✅ L5 Historical Validation',
        'Fraud Score: 12/100 — AUTO APPROVED',
      ],
      status: currentStep >= 2 ? (currentStep > 2 ? 'complete' : 'active') : 'pending',
      time: 3000,
    },
    {
      id: 'calculation',
      title: 'PAYOUT CALCULATION',
      icon: <Coins className="w-6 h-6" />,
      details: [
        'Daily Earnings: ₹686',
        'Disruption Hours: 7 of 8',
        `Calculation: ₹686 × 7/8 = ₹${selectedDisruptionData?.payout || 0}`,
        `Within Max: ✅ (₹${selectedDisruptionData?.payout || 0} < ₹1,000)`,
        `Final Payout: ₹${selectedDisruptionData?.payout || 0}`,
      ],
      status: currentStep >= 3 ? (currentStep > 3 ? 'complete' : 'active') : 'pending',
      time: 4500,
    },
    {
      id: 'transfer',
      title: 'UPI TRANSFER INITIATED',
      icon: <Smartphone className="w-6 h-6" />,
      details: [
        'Razorpay Test Mode',
        `Transaction ID: TXN-2026-${Math.random().toString(36).substring(7).toUpperCase()}`,
        `UPI ID: ${worker?.phone ? worker.phone.slice(-4).padStart(worker.phone.length, 'X') : 'XXXXXX'}@upi`,
        `Amount: ₹${selectedDisruptionData?.payout || 0}`,
        currentStep === 4 ? 'Status: Processing...' : 'Status: Complete',
      ],
      status: currentStep >= 4 ? (currentStep > 4 ? 'complete' : 'active') : 'pending',
      time: 6000,
    },
    {
      id: 'complete',
      title: 'PAYOUT COMPLETE',
      icon: <Sparkles className="w-6 h-6" />,
      details: [
        `₹${selectedDisruptionData?.payout || 0} credited to UPI successfully`,
        `Total time: ${Math.floor(elapsed / 1000)}s`,
        `SMS sent to +91-XXXXXX${worker?.phone?.slice(-4) || '0000'}`,
      ],
      status: currentStep >= 5 ? 'complete' : 'pending',
      time: 7500,
    },
  ];

  if (!selectedDisruption && !showReceipt) {
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
              Back
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Payout Simulation
            </h1>
            <p className="text-xl text-slate-400">
              Watch the complete auto-claim flow from trigger detection to UPI payout
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {disruptions.map((disruption) => (
              <button
                key={disruption.id}
                onClick={() => {
                  setSelectedDisruption(disruption.id);
                  setIsSimulating(true);
                  setCurrentStep(0);
                  setElapsed(0);
                  setShowReceipt(false);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl p-6 transition-all text-left group"
              >
                <div className="text-sm font-semibold text-emerald-500 mb-2">
                  {disruption.id}
                </div>
                <div className="text-lg font-bold text-white mb-4 group-hover:text-emerald-500 transition-colors">
                  {disruption.name}
                </div>
                <div className="text-2xl font-bold text-emerald-500">
                  ₹{disruption.payout}
                </div>
                <div className="text-xs text-slate-400 mt-2">Max Payout</div>
              </button>
            ))}
          </div>
        </div>
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
          <div className="text-slate-400 text-sm">
            Elapsed: {Math.floor(elapsed / 1000)}.{Math.floor((elapsed % 1000) / 100)}s
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showReceipt ? (
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`border rounded-xl p-6 transition-all ${
                  step.status === 'complete'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : step.status === 'active'
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                      step.status === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : step.status === 'active'
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    {step.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      {step.status === 'complete' && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    {step.status !== 'pending' && (
                      <div className="space-y-1 text-sm">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="text-slate-300">
                            └── {detail}
                          </div>
                        ))}
                      </div>
                    )}

                    {step.status === 'active' && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-sm text-emerald-500 font-medium">
                          Processing...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-500 mb-2">
                PAYOUT CONFIRMED
              </h2>
              <p className="text-slate-400">
                Instant UPI transfer completed successfully
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-8 mb-8 space-y-4 border border-slate-700">
              <div className="flex justify-between pb-4 border-b border-slate-700">
                <span className="text-slate-400">Transaction ID</span>
                <span className="text-white font-mono">
                  TXN-2026-{Math.random().toString(36).substring(7).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-700">
                <span className="text-slate-400">Worker</span>
                <span className="text-white">{worker?.name || 'Worker'} ({worker?.partner_id || 'ID'})</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-700">
                <span className="text-slate-400">Zone</span>
                <span className="text-white">{worker?.zone || '—'}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-700">
                <span className="text-slate-400">Trigger Event</span>
                <span className="text-white">
                  {disruptions.find((d) => d.id === selectedDisruption)?.name}
                </span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-700">
                <span className="text-slate-400">Processing Time</span>
                <span className="text-white">
                  {Math.floor(elapsed / 1000)}.{Math.floor((elapsed % 1000) / 100)}s
                </span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="text-lg font-bold text-slate-400">Payout Amount</span>
                <span className="text-3xl font-bold text-emerald-500">
                  ₹{selectedDisruptionData?.payout}
                </span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 mb-8 flex justify-center">
              <div className="w-32 h-32 bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center">
                <div className="w-24 h-24 grid grid-cols-6 gap-1 p-2">
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        Math.random() > 0.5 ? 'bg-white' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mb-8">
              This is a simulated payout for demo purposes
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setSelectedDisruption(null);
                  setCurrentStep(0);
                  setElapsed(0);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                New Simulation
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
