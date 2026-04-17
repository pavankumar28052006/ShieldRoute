/**
 * aiEngine.ts
 *
 * Centralized mock "AI/ML Engine" providing deterministic, explainable results
 * for the UI to represent advanced algorithms.
 */

import { Worker } from './supabase';

const floodProneZones = ['Koramangala', 'Andheri'];
const highTrafficZones = ['Koramangala', 'Banjara Hills', 'Connaught Place'];

export interface FeatureScore {
  name: string;
  weight: number;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface MLRiskResult {
  totalScore: number;
  label: string;
  features: FeatureScore[];
  earningsValidation: {
    declared: number;
    validatedDaily: number;
    benchmarkDaily: number;
    confidence: number;
    status: 'Verified' | 'Adjusted' | 'High Variance';
  };
}

export interface MLPremiumResult {
  basePremium: number;
  finalPremium: number;
  factors: FeatureScore[];
}

export interface MLFraudResult {
  totalScore: number;
  layerScores: {
    L1_GPS: number;
    L2_Activity: number;
    L3_Anomaly: number;
    L4_Duplicate: number;
    L5_History: number;
  };
  flags: string[];
}

export interface ForecastSummary {
  zone: string;
  riskTrend: 'Increasing' | 'Decreasing' | 'Stable';
  expectedTriggers: number;
  payoutExposure: number;
  confidence: number;
}

/** 1. Risk Scoring Engine */
export function computeMLRiskScore(worker: Partial<Worker>): MLRiskResult {
  let score = 0;
  const features: FeatureScore[] = [];

  // Zone Risk (35% weight)
  const isFloodProne = floodProneZones.includes(worker.zone || '');
  const zoneScore = isFloodProne ? 85 : 40;
  score += zoneScore * 0.35;
  features.push({
    name: 'Zone Historical Risk',
    weight: 35,
    score: zoneScore,
    impact: isFloodProne ? 'negative' : 'positive',
    explanation: `${worker.zone} shows ${isFloodProne ? 'high' : 'moderate'} disruption frequency in the past 3 years.`,
  });

  // Earnings Target (25% weight)
  // Higher earnings mean higher risk since payouts will be larger
  const earnings = worker.weekly_earnings || 4000;
  const earningsScore = Math.min(100, Math.max(0, (earnings - 3000) / 40));
  score += earningsScore * 0.25;
  features.push({
    name: 'Earnings Exposure',
    weight: 25,
    score: earningsScore,
    impact: earningsScore > 60 ? 'negative' : 'neutral',
    explanation: `Self-declared ₹${earnings}/wk implies ${earningsScore > 60 ? 'higher' : 'moderate'} payout liability.`,
  });

  // Platform Work Model (15% weight)
  const platformScore = worker.platform === 'Zomato' ? 55 : 45;
  score += platformScore * 0.15;
  features.push({
    name: 'Platform Dynamics',
    weight: 15,
    score: platformScore,
    impact: 'neutral',
    explanation: `Historical data indicates minor variance in task completion rates for ${worker.platform}.`,
  });

  // Tenure/Account Age (15% weight)
  // New accounts are riskier
  let tenureScore = 80;
  if (worker.created_at) {
     const days = (Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24);
     if (days > 30) tenureScore = 50;
     if (days > 90) tenureScore = 20;
  }
  score += tenureScore * 0.15;
  features.push({
    name: 'Account Maturity',
    weight: 15,
    score: tenureScore,
    impact: tenureScore > 60 ? 'negative' : 'positive',
    explanation: tenureScore > 60 ? 'New account limits historical behavioral tracking.' : 'Established activity history available.',
  });

  // Seasonal Baseline (10% weight)
  const month = new Date().getMonth();
  const isMonsoon = month >= 5 && month <= 8; // June - Sept
  const seasonScore = isMonsoon ? 90 : 30;
  score += seasonScore * 0.10;
  features.push({
    name: 'Seasonal Context',
    weight: 10,
    score: seasonScore,
    impact: isMonsoon ? 'negative' : 'positive',
    explanation: isMonsoon ? 'Peak monsoon season elevates base risk probabilty.' : 'Outside of peak weather disruption season.',
  });

  const totalScore = Math.round(score);
  let label = 'Low Risk';
  if (totalScore >= 60) label = 'Medium Risk';
  if (totalScore >= 75) label = 'High Risk';

  // Earnings Validation (Ridge Regression Mock)
  const declaredDaily = Math.round(earnings / 6);
  // Base benchmark for zone
  const benchmarkDaily = highTrafficZones.includes(worker.zone || '') ? 850 : 650;
  
  // Validation logic: if declared is within 25% of benchmark, accept. Else constrain.
  let validatedDaily = declaredDaily;
  let status: 'Verified' | 'Adjusted' | 'High Variance' = 'Verified';
  let confidence = 92;

  if (declaredDaily > benchmarkDaily * 1.25) {
     validatedDaily = Math.round(benchmarkDaily * 1.25);
     status = 'Adjusted';
     confidence = 74;
  } else if (declaredDaily < benchmarkDaily * 0.75) {
     status = 'High Variance';
     confidence = 61;
  }

  return {
    totalScore,
    label,
    features,
    earningsValidation: {
      declared: declaredDaily,
      validatedDaily,
      benchmarkDaily,
      confidence,
      status,
    }
  };
}

/** 2. Premium XGBoost-Style Engine */
export function computePremiumMultipliers(worker: Partial<Worker>, recentClaimsCount: number, basePremium: number): MLPremiumResult {
  const factors: FeatureScore[] = [];
  let multiplier = 1.0;

  // Zone Risk
  const isFloodProne = floodProneZones.includes(worker.zone || '');
  const zm = isFloodProne ? 1.3 : 1.0;
  multiplier *= zm;
  factors.push({
    name: 'Zone Risk Multiplier',
    weight: 50,
    score: zm * 100,
    impact: isFloodProne ? 'negative' : 'neutral',
    explanation: `Historical weather patterns for ${worker.zone}`
  });

  // Tenure
  let tm = 1.0;
  if (worker.created_at) {
    const weeks = Math.floor((Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7));
    if (weeks >= 12) tm = 0.90;
    else if (weeks >= 4) tm = 0.95;
  }
  multiplier *= tm;
  factors.push({
    name: 'Tenure Discount',
    weight: 20,
    score: tm * 100,
    impact: tm < 1.0 ? 'positive' : 'neutral',
    explanation: `${tm < 1.0 ? 'Loyalty discount applied for established history.' : 'No loyalty data available yet.'}`
  });

  // Claim History
  let cm = 1.0;
  if (recentClaimsCount >= 2) cm = 1.30;
  else if (recentClaimsCount === 1) cm = 1.15;
  multiplier *= cm;
  factors.push({
    name: 'Claim Frequency Factor',
    weight: 30,
    score: cm * 100,
    impact: cm > 1.0 ? 'negative' : 'neutral',
    explanation: `${recentClaimsCount} claims in the last 8 weeks.`
  });

  const finalPremium = Math.round(basePremium * multiplier);

  return {
    basePremium,
    finalPremium,
    factors
  };
}

/** 3. 5-Layer Fraud Score Engine */
export function computeL1toL5FraudScore(workerId: string, claimCount: number, accountAgeDays: number): MLFraudResult {
  // Deterministic seed based on worker ID to keep values stable per claim
  const seedHash = workerId.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  const h = Math.abs(seedHash);

  // L1 GPS: Usually fine unless it's a specific mock user
  const L1 = workerId.includes('9201') || workerId.includes('7834') ? 85 : ((h * 13) % 20);
  
  // L2 Activity: Low activity = higher risk
  const L2 = accountAgeDays < 7 ? 65 : ((h * 17) % 30);
  
  // L3 Anomaly (Isolation Forest mock): Spikes with high claim counting
  const L3 = claimCount > 2 ? 75 : ((h * 19) % 25);
  
  // L4 Duplicate: Mostly clean
  const L4 = workerId.includes('5612') ? 80 : ((h * 23) % 15);
  
  // L5 History: Consistency check
  const L5 = ((h * 29) % 20);

  // Weighted average
  const totalScore = Math.round((L1 * 1.5 + L2 * 1.2 + L3 * 1.0 + L4 * 0.8 + L5 * 0.5) / 5);
  
  const flags = [];
  if (L1 > 60) flags.push('GPS Mismatch');
  if (L2 > 60) flags.push('Low App Activity');
  if (L3 > 60) flags.push('Velocity/Frequency Anomaly');
  if (L4 > 60) flags.push('Shared Device Fingerprint');

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    layerScores: {
      L1_GPS: L1,
      L2_Activity: L2,
      L3_Anomaly: L3,
      L4_Duplicate: L4,
      L5_History: L5
    },
    flags
  };
}

/** 4. Predictive 7-Day Forecast (Prophet + LSTM style output) */
export function generate7DayForecast(zones: string[]): ForecastSummary[] {
  // Deterministic daily offset to make demo forecasts look dynamic but stable per day
  const daySeed = new Date().getDate();

  return zones.map((zone, i) => {
    const isFloodProne = floodProneZones.includes(zone);
    const h = (daySeed + i * 7) % 10;
    
    let expectedTriggers = h > 7 ? 2 : (h > 4 ? 1 : 0);
    if (isFloodProne) expectedTriggers += 1;

    let trend: 'Increasing' | 'Decreasing' | 'Stable' = 'Stable';
    if (expectedTriggers > 1) trend = 'Increasing';
    else if (expectedTriggers === 0) trend = 'Decreasing';

    const baseExposure = isFloodProne ? 75000 : 35000;
    const exposure = baseExposure + (expectedTriggers * 15000) + (h * 1000);

    return {
      zone,
      riskTrend: trend,
      expectedTriggers,
      payoutExposure: exposure,
      confidence: 80 + ((h * 13) % 15) // 80-95%
    };
  });
}
