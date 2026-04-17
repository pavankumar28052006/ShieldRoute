/**
 * FraudDetection.tsx
 * Real-time fraud monitoring and anomaly detection dashboard.
 * All fraud breakdown values are memoized per selected event — no random flickering.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FraudEvent {
  id: string;
  workerId: string;
  zone: string;
  trigger: string;
  timestamp: string;
  fraudScore: number;
  signals: string[];
  layerScores?: Record<string, number>;
}

interface GPSAnomaly {
  workerId: string;
  zone: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

const mockFraudEvents: FraudEvent[] = [
  {
    id: 'EVT-001',
    workerId: 'ZOM-BLR-2847',
    zone: 'Koramangala',
    trigger: 'Heavy Rainfall',
    timestamp: new Date().toISOString(),
    fraudScore: 12,
    signals: [],
  },
  {
    id: 'EVT-002',
    workerId: 'SWG-KOL-5612',
    zone: 'Banjara Hills',
    trigger: 'Extreme Heat',
    fraudScore: 45,
    signals: ['New Account', 'GPS Mismatch'],
    layerScores: { L1_GPS: 15, L2_Activity: 65, L3_Anomaly: 40, L4_Duplicate: 10, L5_History: 30 }
  },
  {
    id: 'EVT-003',
    workerId: 'ZOM-DEL-7834',
    zone: 'Connaught Place',
    trigger: 'Severe AQI',
    fraudScore: 72,
    signals: ['GPS Mismatch', 'Velocity Spike', 'IP Anomaly'],
    layerScores: { L1_GPS: 85, L2_Activity: 70, L3_Anomaly: 75, L4_Duplicate: 60, L5_History: 55 }
  },
  {
    id: 'EVT-004',
    workerId: 'SWG-MUM-9201',
    zone: 'Andheri',
    trigger: 'Flood Warning',
    fraudScore: 88,
    signals: ['GPS Spoofing', 'Velocity Spike', 'New Account', 'No App Activity'],
    layerScores: { L1_GPS: 95, L2_Activity: 85, L3_Anomaly: 90, L4_Duplicate: 80, L5_History: 75 }
  },
  {
    id: 'EVT-005',
    workerId: 'ZOM-BLR-3456',
    zone: 'T Nagar',
    trigger: 'Curfew/Bandh',
    timestamp: new Date(Date.now() - 720000).toISOString(),
    fraudScore: 19,
    signals: [],
  },
];

const mockGPSAnomalies: GPSAnomaly[] = [
  { workerId: 'ZOM-2847', zone: 'Koramangala', issue: 'GPS accuracy 0m (physically impossible)', severity: 'high' },
  { workerId: 'ZOM-9123', zone: 'Koramangala', issue: 'Location jump 12km in 4 seconds',          severity: 'high' },
  { workerId: 'ZOM-4521', zone: 'Koramangala', issue: 'IP location: Delhi, GPS location: Bengaluru', severity: 'high' },
];

const fraudRingAccounts = [
  { id: 'ACC-001', name: 'Worker A', risk: 'high' },
  { id: 'ACC-002', name: 'Worker B', risk: 'high' },
  { id: 'ACC-003', name: 'Worker C', risk: 'high' },
  { id: 'ACC-004', name: 'Worker D', risk: 'high' },
  { id: 'ACC-005', name: 'Worker E', risk: 'low' },
  { id: 'ACC-006', name: 'Worker F', risk: 'low' },
  { id: 'ACC-007', name: 'Worker G', risk: 'low' },
  { id: 'ACC-008', name: 'Worker H', risk: 'low' },
];

export default function FraudDetection() {
  const navigate = useNavigate();
  const [events, setEvents]     = useState<FraudEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FraudEvent | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchClaims = async () => {
      const { data } = await supabase
        .from('claims')
        .select('id, created_at, status, amount, trigger_name, fraud_score, fraud_flags, workers(id, name, zone)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const mapped: FraudEvent[] = data.map(c => {
          const w = c.workers as unknown as { id: string, name: string, zone: string };
          const flagsObj = (c.fraud_flags as Record<string, number>) || {};
          const flags = [];
          if (flagsObj.L1_GPS > 60) flags.push('GPS Mismatch');
          if (flagsObj.L2_Activity > 60) flags.push('Low App Activity');
          if (flagsObj.L3_Anomaly > 60) flags.push('Velocity/Anomaly');
          if (flagsObj.L4_Duplicate > 60) flags.push('Duplicate Hash');
          
          return {
            id: c.id.split('-')[0].toUpperCase(), // partial UUID for UI
            workerId: w?.name ? `${w.name} (${w.id.split('-')[0]})` : 'Unknown Worker',
            zone: w?.zone || 'Unknown Zone',
            trigger: c.trigger_name,
            timestamp: c.created_at,
            fraudScore: c.fraud_score,
            signals: flags,
            layerScores: {
              L1_GPS: flagsObj.L1_GPS ?? 10,
              L2_Activity: flagsObj.L2_Activity ?? (flagsObj.activity_signal || 10),
              L3_Anomaly: flagsObj.L3_Anomaly ?? (flagsObj.anomaly_score || 10),
              L4_Duplicate: flagsObj.L4_Duplicate ?? 5,
              L5_History: flagsObj.L5_History ?? 5
            }
          };
        });
        setEvents(mapped);
        setSelectedEvent(mapped[0]);
      } else {
         // Fallback if no data
         const dummy = mockFraudEvents.filter(m => m.layerScores);
         setEvents(dummy);
         setSelectedEvent(dummy[0]);
      }
    };
    fetchClaims();
  }, []);

  const getFraudColor = (score: number) => {
    if (score < 30) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score < 61) return 'bg-yellow-500/10 border-yellow-500/30';
    if (score < 81) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getFraudLabel = (score: number) => {
    if (score < 30) return { text: 'AUTO APPROVED', icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-400' };
    if (score < 61) return { text: 'SOFT REVIEW',   icon: <Clock className="w-3 h-3" />,        color: 'text-yellow-400' };
    if (score < 81) return { text: 'VERIFICATION',  icon: <AlertTriangle className="w-3 h-3" />, color: 'text-orange-400' };
    return               { text: 'BLOCKED',         icon: <XCircle className="w-3 h-3" />,       color: 'text-red-400' };
  };

  const getBarColor = (score: number) => {
    if (score < 30) return 'bg-emerald-500';
    if (score < 61) return 'bg-yellow-500';
    if (score < 81) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <nav className="nav-glass border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg glass-emerald flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">ShieldRoute</span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-1">Fraud Detection Center</h1>
          <p className="text-slate-400">Real-time fraud monitoring and advanced anomaly detection</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { value: '847', label: 'Auto-Approved', color: 'text-emerald-400' },
            { value: '23',  label: 'Soft Reviews', color: 'text-yellow-400' },
            { value: '8',   label: 'Verification Req.', color: 'text-orange-400' },
            { value: '2',   label: 'Hard Blocks', color: 'text-red-400' },
            { value: '0.3%', label: 'False Positive Rate', color: 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover-glow transition-all animate-fade-in">
              <div className={`text-2xl font-black ${stat.color} mb-1 stat-number`}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Real-Time Fraud Monitor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-2 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Real-Time Fraud Monitor</h3>
              <span className="text-xs text-slate-400 tabular-nums">
                Updated: {time.toLocaleTimeString()}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {events.map((event) => {
                const label = getFraudLabel(event.fraudScore);
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all hover-glow ${
                      selectedEvent?.id === event.id
                        ? 'border-emerald-500 bg-slate-800'
                        : 'border-slate-700 hover:border-slate-600'
                    } ${getFraudColor(event.fraudScore)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{event.id}</div>
                        <div className="text-xs text-slate-400 font-mono">{event.workerId}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-black ${label.color}`}>{event.fraudScore}</div>
                        <div className={`text-[10px] font-bold flex items-center gap-1 justify-end ${label.color}`}>
                          {label.icon} {label.text}
                        </div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="w-full bg-slate-700/60 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full ${getBarColor(event.fraudScore)}`}
                        style={{ width: `${event.fraudScore}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{event.zone} · {event.trigger}</span>
                      <span className="text-slate-500 tabular-nums">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {event.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.signals.map((signal, idx) => (
                           <span
                             key={idx}
                             className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-medium"
                           >
                             {signal}
                           </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
              {events.length === 0 && <div className="text-slate-500 text-center py-4 text-sm animate-pulse">Loading live events...</div>}
            </div>
          </div>

          {/* Genuine Worker Protection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-100">
            <h3 className="text-lg font-bold text-white mb-5">Worker Protection</h3>
            <div className="space-y-5">
              {[
                { val: '847', label: 'Auto-Approved Today',    color: 'text-emerald-400', border: 'border-emerald-500/20' },
                { val: '23',  label: 'Soft Reviews Resolved',  color: 'text-yellow-400',  border: 'border-yellow-500/20' },
                { val: '8',   label: 'Verification Requests',  color: 'text-orange-400',  border: 'border-orange-500/20' },
                { val: '2',   label: 'Hard Blocks',            color: 'text-red-400',     border: 'border-red-500/20' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between py-3 border-b ${item.border}`}>
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className={`text-xl font-black ${item.color} stat-number`}>{item.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-400 text-center">
                ✅ No genuine worker hard-blocked today
              </p>
            </div>
          </div>
        </div>

        {/* GPS Spoofing + Fraud Ring */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* GPS Spoofing */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">GPS Spoofing Detection</h3>
            </div>

            {/* Mini zone grid */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-md ${
                      i % 7 === 2 || i % 7 === 4
                        ? 'bg-red-500/60 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center">Koramangala Zone — Live Activity Map</p>
            </div>

            <p className="text-sm font-semibold text-red-400 mb-3">
              ⚠️ {mockGPSAnomalies.length} suspicious GPS signals detected
            </p>

            <div className="space-y-2">
              {mockGPSAnomalies.map((anomaly, idx) => (
                <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="font-mono text-xs text-white mb-1">{anomaly.workerId}</div>
                  <div className="text-sm text-red-300">{anomaly.issue}</div>
                  <div className="text-[10px] text-red-500 font-bold mt-1 uppercase">🚩 Flagged</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Ring Detection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold text-white">Fraud Ring Detection</h3>
            </div>

            {/* Network graph */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4" style={{ height: '200px' }}>
              <svg className="w-full h-full" viewBox="0 0 250 200">
                {fraudRingAccounts.map((acc, i) => {
                  const angle = (i / fraudRingAccounts.length) * Math.PI * 2;
                  const x = 125 + 75 * Math.cos(angle);
                  const y = 100 + 70 * Math.sin(angle);
                  const isHighRisk = acc.risk === 'high';

                  return (
                    <g key={i}>
                      {isHighRisk && (
                        <line x1={x} y1={y} x2={125} y2={100}
                          stroke="#ef4444" strokeWidth="1" opacity="0.4" strokeDasharray="3,2" />
                      )}
                      <circle cx={x} cy={y} r="10"
                        fill={isHighRisk ? '#ef4444' : '#10b981'}
                        opacity={isHighRisk ? 0.85 : 0.5}
                        className={isHighRisk ? 'animate-pulse' : ''}
                      />
                      <text x={x} y={y + 4} textAnchor="middle"
                        fontSize="7" fill="white" fontWeight="bold">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
                {/* Center hub */}
                <circle cx="125" cy="100" r="8" fill="#ef4444" opacity="0.3" className="animate-pulse" />
              </svg>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 text-sm">RING DETECTED</span>
                <span className="badge bg-red-500 text-white text-[10px]">FROZEN</span>
              </div>
              <p className="text-xs text-red-300 mt-1">4 coordinated accounts, same IP subnet & device fingerprint</p>
            </div>

            <div className="space-y-1 text-xs">
              {[
                ['Shared Signals', 'Device FP + IP Subnet'],
                ['Time Window',   '8 minutes'],
                ['Action',        'All payouts frozen'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fraud Score Breakdown */}
        {selectedEvent && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-scale-in">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-lg font-bold text-white">
                ML Assessment Breakdown — <span className="text-emerald-400">{selectedEvent.id}</span>
                <span className="text-slate-400 font-normal text-sm ml-2">({selectedEvent.workerId} · {selectedEvent.zone})</span>
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider">
                 <Activity className="w-3.5 h-3.5" /> ISOLATION FOREST MODEL
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {Object.entries({
                  'L1: GPS Integrity':    selectedEvent.layerScores?.L1_GPS || 0,
                  'L2: Activity Signal':  selectedEvent.layerScores?.L2_Activity || 0,
                  'L3: Anomaly Score':    selectedEvent.layerScores?.L3_Anomaly || 0,
                  'L4: Duplicate Check':  selectedEvent.layerScores?.L4_Duplicate || 0,
                  'L5: History & Context':selectedEvent.layerScores?.L5_History || 0,
                }).map(([label, value]) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                      <span className={`text-sm font-semibold ${getFraudLabel(value).color}`}>{Math.round(value)}/100</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getBarColor(value)} transition-all duration-500`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="bg-slate-800 rounded-xl p-6 mb-4 text-center">
                  <div className="text-5xl font-black text-white mb-1 stat-number">
                    {Math.round(selectedEvent.fraudScore)}
                    <span className="text-xl text-slate-500">/100</span>
                  </div>
                  <div className={`text-base font-bold mb-4 flex items-center justify-center gap-2 ${ getFraudLabel(selectedEvent.fraudScore).color}`}>
                    {getFraudLabel(selectedEvent.fraudScore).icon}
                    {getFraudLabel(selectedEvent.fraudScore).text}
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getBarColor(selectedEvent.fraudScore)} transition-all duration-700`}
                      style={{ width: `${selectedEvent.fraudScore}%` }}
                    />
                  </div>
                </div>

                {selectedEvent.signals.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-2">Signals Triggered:</p>
                    <div className="space-y-2">
                      {selectedEvent.signals.map((signal, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-red-500/10 text-red-300 px-3 py-2 rounded-lg border border-red-500/30"
                        >
                          🚩 {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-emerald-300">No fraud signals detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
