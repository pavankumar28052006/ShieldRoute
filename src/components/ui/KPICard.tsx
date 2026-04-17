import React from 'react';

interface KPICardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
  valueColor?: string;
  delay?: number;
}

export function KPICard({
  icon,
  iconBg,
  value,
  label,
  valueColor = 'text-white',
  delay = 0,
}: KPICardProps) {
  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover-glow transition-all animate-fade-in"
      style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : {}}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold stat-number ${valueColor}`}>{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}
