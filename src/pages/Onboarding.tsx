import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, User, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const zones = [
  'Koramangala',
  'Banjara Hills',
  'Andheri',
  'Connaught Place',
  'T Nagar',
];

const floodProneZones = ['Koramangala', 'Andheri'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [name, setName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [platform, setPlatform] = useState('Zomato');
  const [zone, setZone] = useState('');
  const [weeklyEarnings, setWeeklyEarnings] = useState(4000);

  const [riskScore, setRiskScore] = useState(0);
  const [showRiskScore, setShowRiskScore] = useState(false);

  const sendOtp = () => {
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp.length === 6) {
      setStep(2);
    }
  };

  const calculateRiskScore = () => {
    let score = 50;
    if (floodProneZones.includes(zone)) score += 15;
    if (weeklyEarnings > 5000) score += 10;
    if (platform === 'Zomato') score += 5;
    return score;
  };

  const submitOnboarding = async () => {
    setLoading(true);
    const calculatedRiskScore = calculateRiskScore();
    setRiskScore(calculatedRiskScore);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;

    if (authError || !authUserId) {
      setLoading(false);
      alert('Session unavailable. Please refresh and try again.');
      return;
    }

    const { data, error } = await supabase
      .from('workers')
      .insert({
        id: authUserId,
        phone,
        name,
        partner_id: partnerId,
        platform,
        zone,
        weekly_earnings: weeklyEarnings,
        risk_score: calculatedRiskScore,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating worker:', error);
      alert('Error creating account. Please try again.');
      return;
    }

    setShowRiskScore(true);
    setTimeout(() => {
      navigate('/plans', { state: { worker: data } });
    }, 3000);
  };

  const getRiskLabel = (score: number) => {
    if (score < 60) return { label: 'Low Risk', color: 'text-emerald-500' };
    if (score < 75) return { label: 'Medium Risk', color: 'text-yellow-500' };
    return { label: 'High Risk', color: 'text-red-500' };
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-10 h-10 text-emerald-500" />
            <span className="text-3xl font-bold text-white">ShieldRoute</span>
          </div>
          <p className="text-slate-400">Get protected in minutes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      s < step ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Verify Your Phone
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-sm text-slate-400 mt-2">
                      Demo mode: Enter any 6-digit code
                    </p>
                  </div>
                )}

                <button
                  onClick={otpSent ? verifyOtp : sendOtp}
                  disabled={!phone || (otpSent && otp.length !== 6)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {otpSent ? 'Verify OTP' : 'Send OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Your Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ravi Kumar"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Partner ID
                  </label>
                  <input
                    type="text"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    placeholder="ZOM-BLR-2847"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delivery Zone
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select zone</option>
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Weekly Earnings: ₹{weeklyEarnings}
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
                    <span>₹3,500</span>
                    <span>₹7,000</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!name || !partnerId || !zone}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Review & Submit
              </h2>

              {!showRiskScore ? (
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="text-white">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Platform</span>
                      <span className="text-white">{platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Partner ID</span>
                      <span className="text-white">{partnerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Zone</span>
                      <span className="text-white">{zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weekly Earnings</span>
                      <span className="text-white">₹{weeklyEarnings}</span>
                    </div>
                  </div>

                  <button
                    onClick={submitOnboarding}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {loading ? 'Processing...' : 'Complete Registration'}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-12 h-12 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      AI Risk Score Generated
                    </h3>
                    <div className="text-6xl font-bold mb-2">
                      <span className={getRiskLabel(riskScore).color}>
                        {riskScore}
                      </span>
                      <span className="text-slate-600">/100</span>
                    </div>
                    <p className={`text-lg font-semibold ${getRiskLabel(riskScore).color}`}>
                      {getRiskLabel(riskScore).label}
                    </p>
                  </div>
                  <p className="text-slate-400">
                    Redirecting to plan selection...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
