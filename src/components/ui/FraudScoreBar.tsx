import React from 'react';

function getFraudColor(score: number) {
  if (score <= 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (score <= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function getFraudBgColor(score: number) {
  if (score <= 30) return 'bg-emerald-500';
  if (score <= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface FraudScoreBarProps {
  score: number;
}

export function FraudScoreBar({ score }: FraudScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 max-w-[120px] bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getFraudBgColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={`px-2 py-0.5 rounded-full border text-xs font-bold stat-number ${getFraudColor(score)}`}>
        {score}/100
      </span>
    </div>
  );
}
