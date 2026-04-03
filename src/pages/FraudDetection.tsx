import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

interface FraudEvent {
  id: string;
  workerId: string;
  zone: string;
  trigger: string;
  timestamp: string;
  fraudScore: number;
  signals: string[];
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
    timestamp: new Date(Date.now() - 120000).toISOString(),
    fraudScore: 45,
    signals: ['New Account', 'GPS Mismatch'],
  },
  {
    id: 'EVT-003',
    workerId: 'ZOM-DEL-7834',
    zone: 'Connaught Place',
    trigger: 'Severe AQI',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    fraudScore: 72,
    signals: ['GPS Mismatch', 'Velocity Spike', 'IP Anomaly'],
  },
  {
    id: 'EVT-004',
    workerId: 'SWG-MUM-9201',
    zone: 'Andheri',
    trigger: 'Flood Warning',
    timestamp: new Date(Date.now() - 480000).toISOString(),
    fraudScore: 88,
    signals: ['GPS Spoofing', 'Velocity Spike', 'New Account', 'No App Activity'],
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
  {
    workerId: 'ZOM-2847',
    zone: 'Koramangala',
    issue: 'GPS accuracy 0m (impossible)',
    severity: 'high',
  },
  {
    workerId: 'ZOM-9123',
    zone: 'Koramangala',
    issue: 'Location jump 12km in 4 seconds',
    severity: 'high',
  },
  {
    workerId: 'ZOM-4521',
    zone: 'Koramangala',
    issue: 'IP location: Delhi, GPS location: Bengaluru',
    severity: 'high',
  },
];

const fraudRingAccounts = [
  { id: 'ACC-001', name: 'Worker A', risk: 'high', devices: 1, ips: 1 },
  { id: 'ACC-002', name: 'Worker B', risk: 'high', devices: 1, ips: 1 },
  { id: 'ACC-003', name: 'Worker C', risk: 'high', devices: 1, ips: 1 },
  { id: 'ACC-004', name: 'Worker D', risk: 'high', devices: 1, ips: 1 },
  { id: 'ACC-005', name: 'Worker E', risk: 'low', devices: 2, ips: 3 },
  { id: 'ACC-006', name: 'Worker F', risk: 'low', devices: 1, ips: 1 },
  { id: 'ACC-007', name: 'Worker G', risk: 'low', devices: 1, ips: 1 },
  { id: 'ACC-008', name: 'Worker H', risk: 'low', devices: 1, ips: 1 },
];

export default function FraudDetection() {
  const navigate = useNavigate();
  const [events] = useState<FraudEvent[]>(mockFraudEvents);
  const [selectedEvent, setSelectedEvent] = useState<FraudEvent | null>(
    mockFraudEvents[0]
  );
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFraudColor = (score: number) => {
    if (score < 30) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score < 61) return 'bg-yellow-500/10 border-yellow-500/30';
    if (score < 81) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getFraudLabel = (score: number) => {
    if (score < 30) return 'AUTO APPROVED';
    if (score < 61) return 'SOFT REVIEW';
    if (score < 81) return 'VERIFICATION REQUIRED';
    return 'BLOCKED';
  };

  const getFraudTextColor = (score: number) => {
    if (score < 30) return 'text-emerald-500';
    if (score < 61) return 'text-yellow-500';
    if (score < 81) return 'text-orange-500';
    return 'text-red-500';
  };

  const fraudBreakdown = selectedEvent
    ? {
        gpsIntegrity: Math.random() * 100,
        activitySignal: Math.random() * 100,
        accountAge: Math.random() * 100,
        velocityScore: Math.random() * 100,
        networkAnomaly: Math.random() * 100,
      }
    : null;

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
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Fraud Detection Center
          </h1>
          <p className="text-slate-400">
            Real-time fraud monitoring and advanced anomaly detection
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Real-Time Fraud Monitor</h3>
              <span className="text-xs text-slate-400">
                Last updated: {time.toLocaleTimeString()}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedEvent?.id === event.id
                      ? 'border-emerald-500 bg-slate-800'
                      : 'border-slate-700 hover:border-slate-600'
                  } ${getFraudColor(event.fraudScore)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">{event.id}</div>
                      <div className="text-sm text-slate-400">{event.workerId}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getFraudTextColor(event.fraudScore)}`}>
                        {Math.round(event.fraudScore)}
                      </div>
                      <div className={`text-xs font-semibold ${getFraudTextColor(event.fraudScore)}`}>
                        {getFraudLabel(event.fraudScore)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        event.fraudScore < 30
                          ? 'bg-emerald-500'
                          : event.fraudScore < 61
                          ? 'bg-yellow-500'
                          : event.fraudScore < 81
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${event.fraudScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{event.zone} • {event.trigger}</span>
                    <span className="text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.signals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {event.signals.map((signal, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Genuine Worker Protection</h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-emerald-500">847</div>
                <div className="text-sm text-slate-400">Auto-Approved Today</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">23</div>
                <div className="text-sm text-slate-400">Soft Reviews (Resolved)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">8</div>
                <div className="text-sm text-slate-400">Verification Requests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">2</div>
                <div className="text-sm text-slate-400">Hard Blocks</div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="text-lg font-bold text-emerald-500">0.3%</div>
                <div className="text-sm text-slate-400">False Positive Rate</div>
              </div>
            </div>
            <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-400">
                No genuine worker has been hard-blocked today
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-bold text-white">GPS Spoofing Detection</h3>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-5 gap-1 mb-4">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-full aspect-square rounded ${
                      i % 7 === 2 || i % 7 === 4
                        ? 'bg-red-500/60 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-400 text-center">
                Koramangala Zone Activity Map
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-500">
                3 suspicious GPS signals detected
              </p>
              {mockGPSAnomalies.map((anomaly, idx) => (
                <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="font-mono text-sm text-white mb-1">
                    {anomaly.workerId}
                  </div>
                  <div className="text-sm text-red-400">{anomaly.issue}</div>
                  <div className="text-xs text-red-500 font-semibold mt-1">FLAGGED</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-bold text-white">Fraud Ring Detection</h3>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 mb-6 relative" style={{ height: '250px' }}>
              <svg className="w-full h-full">
                {fraudRingAccounts.map((_, i) => {
                  const angle = (i / fraudRingAccounts.length) * Math.PI * 2;
                  const x = 125 + 80 * Math.cos(angle);
                  const y = 125 + 80 * Math.sin(angle);
                  const isHighRisk = i < 4;

                  return (
                    <g key={i}>
                      {i < 4 && fraudRingAccounts[i].risk === 'high' && (
                        <>
                          <line
                            x1={x}
                            y1={y}
                            x2={125}
                            y2={125}
                            stroke={isHighRisk ? '#ef4444' : '#64748b'}
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        </>
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill={isHighRisk ? '#ef4444' : '#10b981'}
                        opacity={isHighRisk ? 0.8 : 0.5}
                        className={isHighRisk ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-red-500">RING DETECTED</div>
                <div className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                  FROZEN
                </div>
              </div>
              <div className="text-sm text-red-400">
                4 coordinated accounts detected
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Shared Signals:</span>
                <span className="text-white">Device FP, IP Subnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Window:</span>
                <span className="text-white">8 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="text-red-500">All payouts frozen</span>
              </div>
            </div>
          </div>
        </div>

        {selectedEvent && fraudBreakdown && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Fraud Score Breakdown — {selectedEvent.id}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { label: 'GPS Integrity', value: fraudBreakdown.gpsIntegrity },
                  { label: 'Activity Signal', value: fraudBreakdown.activitySignal },
                  { label: 'Account Age', value: fraudBreakdown.accountAge },
                  { label: 'Velocity Score', value: fraudBreakdown.velocityScore },
                  { label: 'Network Anomaly', value: fraudBreakdown.networkAnomaly },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        {item.label}
                      </span>
                      <span className="text-sm text-emerald-500">
                        {Math.round(item.value)}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="bg-slate-800 rounded-lg p-6 mb-4">
                  <div className="text-4xl font-bold text-white mb-2">
                    {Math.round(selectedEvent.fraudScore)}
                    <span className="text-lg text-slate-500">/100</span>
                  </div>
                  <div
                    className={`text-lg font-bold mb-4 ${getFraudTextColor(
                      selectedEvent.fraudScore
                    )}`}
                  >
                    {getFraudLabel(selectedEvent.fraudScore)}
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        selectedEvent.fraudScore < 30
                          ? 'bg-emerald-500'
                          : selectedEvent.fraudScore < 61
                          ? 'bg-yellow-500'
                          : selectedEvent.fraudScore < 81
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedEvent.fraudScore}%` }}
                    />
                  </div>
                </div>

                {selectedEvent.signals.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-3">
                      Signals Triggered:
                    </p>
                    <div className="space-y-2">
                      {selectedEvent.signals.map((signal, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-red-500/10 text-red-400 px-3 py-2 rounded border border-red-500/30"
                        >
                          {signal}
                        </div>
                      ))}
                    </div>
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
