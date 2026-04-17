import React from 'react';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon = <Archive className="w-8 h-8 text-slate-600" />, 
  title, 
  description,
  action 
}: EmptyStateProps) {
  return (
    <div className="w-full py-16 flex flex-col justify-center items-center text-center animate-fade-in">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-800/50 flex flex-col items-center justify-center mb-6 shadow-inner border border-slate-700/50">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800">
           {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
