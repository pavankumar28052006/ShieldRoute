import { Shield, Zap, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">ShieldRoute</span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Admin
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-32 text-center">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Your income. Protected.
            <br />
            <span className="text-emerald-500">Automatically.</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
            Parametric insurance for Zomato & Swiggy delivery partners. Weekly coverage from ₹29.
            Zero claim filing. Instant UPI payouts.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/onboard')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Protected
            </button>
            <button
              onClick={scrollToFeatures}
              className="border border-slate-700 hover:border-emerald-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              See How It Works
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">5M+</div>
              <div className="text-slate-400">Workers Eligible</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">₹29</div>
              <div className="text-slate-400">Starting Premium</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">2 Hour</div>
              <div className="text-slate-400">Payout Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-500 mb-2">5</div>
              <div className="text-slate-400">Disruptions Covered</div>
            </div>
          </div>
        </div>

        <div id="features" className="py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Zero-Touch Claims</h3>
              <p className="text-slate-400">
                No forms, no documents. When disruptions occur, payouts are triggered automatically
                based on verified weather and event data.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Weekly Pricing</h3>
              <p className="text-slate-400">
                Pay only for the weeks you need coverage. No long-term commitments.
                Flexible pricing based on your zone and risk profile.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Payouts</h3>
              <p className="text-slate-400">
                Money hits your UPI account within 2 hours of trigger detection.
                No waiting, no paperwork, no hassle.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>ShieldRoute | Guidewire DEVTrails 2026 | SRM University AP</p>
        </div>
      </footer>
    </div>
  );
}
