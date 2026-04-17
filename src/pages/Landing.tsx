/**
 * Landing.tsx
 * Hero landing page for ShieldRoute — animated, premium design.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  MapPin,
  CloudRain,
  Thermometer,
  Wind,
  AlertTriangle,
  ArrowRight,
  Github,
  Lock,
} from 'lucide-react';

/* ── Animated Counter ── */
function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number | string; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (typeof target !== 'number') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const duration = 1800;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="stat-number">
      {prefix}{typeof target === 'number' ? display.toLocaleString('en-IN') : target}{suffix}
    </div>
  );
}

/* ── Floating Orb ── */
function FloatingOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

/* ── Trigger Badge ── */
function TriggerBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${color} border`}>
      {icon}
      {label}
    </div>
  );
}

const steps = [
  {
    num: '01',
    title: 'Configure Risk Perimeter',
    desc: 'Input primary delivery zone parameters. Our deterministic AI engine instantly calibrates baseline exposure indices via biometric OTP.',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    num: '02',
    title: 'Deploy Dynamic Policy',
    desc: 'Select from standardized volatility tiers. XGBoost predictive modeling adjusts premiums in real-time based on live climatological risk factors.',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    num: '03',
    title: 'Autonomous Claim Execution',
    desc: 'API-driven thresholds monitor regional data continuously. Upon breach, our heuristic pipeline validates anomaly signatures and executes frictionless UPI settlement protocols.',
    icon: <Zap className="w-6 h-6" />,
  },
];

const features = [
  {
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
    title: 'Algorithmic Trigger Network',
    desc: 'No manual claim forms. Payouts are autonomously fired via integrations with certified API endpoints verifying macro-climate and civil disturbance events.',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
    title: 'Dynamic Risk Engine',
    desc: 'Static pricing is obsolete. Premiums dynamically adapt using Ridge-regression multi-factor validation against historical loss ratios and zone volatility.',
    bg: 'bg-blue-500/10',
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-400" />,
    title: 'Zero-Latency Settlement',
    desc: 'Capital deployed when it matters most. Parametric infrastructure removes human bureaucracy, settling verified claims to verified credentials instantly.',
    bg: 'bg-purple-500/10',
  },
  {
    icon: <Shield className="w-6 h-6 text-yellow-400" />,
    title: 'Tier-5 Fraud Matrices',
    desc: 'Military-grade validation mechanisms (GPS corroboration, Activity heuristics, Anomaly clustering) secure the pool without degrading the user experience.',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: <MapPin className="w-6 h-6 text-red-400" />,
    title: 'Micro-Grid Precision',
    desc: 'Hazards are isolated by geographic micro-grids. An isolated disruption on the north side doesn\'t artificially trigger system-wide capital allocation.',
    bg: 'bg-red-500/10',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-orange-400" />,
    title: 'Hyper-Targeted Scope',
    desc: 'Engineered exclusively for acute income-interruption scenarios, optimizing the core weakness of traditional gig-economy liability models.',
    bg: 'bg-orange-500/10',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen mesh-bg overflow-x-hidden">
      {/* Floating background orbs */}
      <FloatingOrb className="w-[600px] h-[600px] top-[-200px] left-[-200px] bg-emerald-500/8 animate-float" />
      <FloatingOrb className="w-[400px] h-[400px] top-[40%] right-[-150px] bg-indigo-500/6 animate-float delay-700" />
      <FloatingOrb className="w-[300px] h-[300px] bottom-[20%] left-[10%] bg-emerald-500/5 animate-float delay-1000" />

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          navScrolled ? 'nav-glass shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg glass-emerald flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ShieldRoute</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={scrollToFeatures}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Admin
            </button>
            <button
              onClick={() => navigate('/onboard')}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Get Protected
            </button>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => navigate('/onboard')}
            className="md:hidden btn-primary text-sm px-4 py-2"
          >
            Get Protected
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hackathon badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Guidewire DEVTrails 2026 · SRM University AP
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight animate-slide-up">
            Bulletproof Continuity for the{' '}
            <span className="gradient-text">Gig Economy.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
            The first AI-driven parametric infrastructure protecting{' '}
            <span className="text-white font-semibold">5M+ independent fleets</span>{' '}
            against systemic volatility.{' '}
            <strong className="text-emerald-400">Zero human intervention. Frictionless automated settlement.</strong>
          </p>

          {/* Trigger pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 animate-fade-in delay-200">
            <TriggerBadge icon={<CloudRain className="w-3.5 h-3.5" />} label="Heavy Rain" color="text-blue-400 bg-blue-500/10 border-blue-500/30" />
            <TriggerBadge icon={<Thermometer className="w-3.5 h-3.5" />} label="Extreme Heat" color="text-orange-400 bg-orange-500/10 border-orange-500/30" />
            <TriggerBadge icon={<Wind className="w-3.5 h-3.5" />} label="Severe AQI" color="text-purple-400 bg-purple-500/10 border-purple-500/30" />
            <TriggerBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Flood Warning" color="text-red-400 bg-red-500/10 border-red-500/30" />
            <TriggerBadge icon={<Shield className="w-3.5 h-3.5" />} label="Curfew / Bandh" color="text-yellow-400 bg-yellow-500/10 border-yellow-500/30" />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
            <button
              id="hero-cta-primary"
              onClick={() => navigate('/onboard')}
              className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 glow-emerald-sm"
            >
              Get Protected Today
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="hero-cta-secondary"
              onClick={() => navigate('/simulate')}
              className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-emerald-400" />
              Watch Payout Demo
            </button>
          </div>

          {/* Floating UI Mock */}
          <div className="relative mt-20 max-w-4xl mx-auto animate-slide-up delay-400">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
            <div className="relative glass-card border border-slate-700/50 shadow-2xl p-2 rounded-2xl md:rounded-[2rem] overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
              <div className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-[1.75rem] overflow-hidden flex flex-col md:flex-row h-64 md:h-80">
                
                {/* Mock Phone Area */}
                <div className="md:w-1/3 bg-slate-950 p-6 flex flex-col justify-center border-r border-slate-800">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">VibeCoders Engine</div>
                   <div className="space-y-4">
                     <div className="flex gap-3 items-center">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden"><div className="w-full h-full bg-emerald-500 animate-pulse" /></div>
                     </div>
                     <div className="flex gap-3 items-center">
                       <Shield className="w-5 h-5 text-emerald-500" />
                       <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden"><div className="w-full h-full bg-emerald-500 animate-pulse delay-150" /></div>
                     </div>
                     <div className="flex gap-3 items-center">
                       <Lock className="w-5 h-5 text-yellow-500" />
                       <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden"><div className="w-3/4 h-full bg-yellow-500 animate-pulse delay-300" /></div>
                     </div>
                   </div>
                   <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                     <span className="text-slate-400 text-sm">Target Payout</span>
                     <span className="text-emerald-400 font-bold">₹1,000</span>
                   </div>
                </div>

                {/* Mock Code / Graph Area */}
                <div className="flex-1 bg-[#0d1117] relative p-6 font-mono text-[10px] md:text-sm text-emerald-500/70 overflow-hidden">
                  <div className="absolute top-4 right-4 text-xs font-sans text-slate-500 flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <span className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="w-3/4"><span className="text-blue-400">const</span> <span className="text-yellow-200">shieldEngine</span> = <span className="text-blue-400">new</span> XGBoostModel()</div>
                    <div className="w-full">await shieldEngine.<span className="text-yellow-200">detectDisruptions</span>('Koramangala')</div>
                    <div className="text-slate-500">// Validating Isolation Forest layers 1-5...</div>
                    <div className="w-5/6 text-green-400">{'>>'} RISK: LOW | L1: PASS | L3: PASS</div>
                    <div className="w-full text-green-400">{'>>'} INITIATING UPI TRANSFER VIA RAZORPAY...</div>
                    <div className="w-1/2 text-white font-bold bg-green-500/20 px-2 rounded mt-4">✓ PAYOUT SUCCESSFUL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 animate-fade-in delay-500">
            {[
              { value: 5000000, suffix: '+', label: 'Eligible Workers', prefix: '' },
              { value: 29, prefix: '₹', label: 'Starting Premium', suffix: '/wk' },
              { value: 2, prefix: '', label: 'Hour Payout Time', suffix: 'hr' },
              { value: 5, prefix: '', label: 'Disruptions Covered', suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="text-center glass rounded-2xl p-6 hover-glow transition-all">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-2 gradient-text">
                  <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How ShieldRoute Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="relative glass-card p-8 hover-glow transition-all animate-slide-up"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                {/* Step connector */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 z-10">
                    <ChevronRight className="w-6 h-6 text-emerald-500/40" />
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl glass-emerald flex items-center justify-center mb-6 text-emerald-400">
                  {step.icon}
                </div>
                <div className="text-4xl font-black text-emerald-500/20 mb-3 stat-number">{step.num}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Ravi's story */}
          <div className="mt-16 card-gradient-border p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-emerald flex items-center justify-center flex-shrink-0 text-2xl glow-emerald-sm">
                🛵
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-white">Ravi's Story — Bengaluru, Koramangala</h3>
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Real Scenario</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Tuesday, 11:42 AM. IMD reports <span className="text-blue-400 font-semibold">68mm rainfall</span> in 6 hours in Koramangala.
                  ShieldRoute's trigger engine detects the breach instantly. Fraud validation passes in 4 minutes.
                  By <span className="text-emerald-400 font-bold">1:15 PM</span>, ₹600 is credited to Ravi's UPI ID.{' '}
                  <strong className="text-white">He did nothing.</strong>
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Trigger detected automatically
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Fraud score: 12/100
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ₹600 UPI payout in 93 minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Enterprise Resilience Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Smarter Underwriting. Unbreakable Operations.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="glass-card p-7 hover-glow transition-all group animate-fade-in"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans Preview ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Weekly Plans</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 mt-4">Align with your weekly payout cycle. No annual commitments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: 29, payout: 500, triggers: ['Rain'], color: 'border-slate-700' },
              { name: 'Standard', price: 49, payout: 1000, triggers: ['Rain', 'Heat', 'AQI'], color: 'border-emerald-500 glow-emerald-sm', recommended: true },
              { name: 'Plus', price: 79, payout: 2000, triggers: ['Rain', 'Heat', 'AQI', 'Flood', 'Curfew'], color: 'border-slate-700' },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative glass-card border-2 ${plan.color} p-8 transition-all hover-glow`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-emerald text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    ⭐ Recommended
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name} Shield</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black text-emerald-400">₹{plan.price}</span>
                  <span className="text-slate-400">/week</span>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.triggers.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {t} coverage
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold pt-2 border-t border-slate-800 mt-3">
                    <Zap className="w-4 h-4" />
                    Max payout: ₹{plan.payout.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/onboard')}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                    plan.recommended
                      ? 'bg-gradient-emerald hover:shadow-lg hover:shadow-emerald-500/20 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center card-gradient-border p-12">
          <div className="w-16 h-16 rounded-2xl glass-emerald flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to protect your income?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of delivery partners getting automatic protection from weather, pollution, and civic disruptions.
          </p>
          <button
            onClick={() => navigate('/onboard')}
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 glow-emerald"
          >
            Start for ₹29/week
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg glass-emerald flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-bold">ShieldRoute</div>
                <div className="text-xs text-slate-500">Guidewire DEVTrails 2026 · Team VibeCoders</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-slate-500 text-xs">SRM University AP · Batch 2023–2027</span>
              <a
                href="https://github.com/pavankumar28052006/gigshield"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <button
                onClick={() => navigate('/admin')}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-600">
              ShieldRoute covers income loss only. Not health, life, vehicle, or accident insurance.
              For demo/hackathon purposes only — not a licensed insurance product.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
