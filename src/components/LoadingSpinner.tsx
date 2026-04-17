/**
 * LoadingSpinner.tsx
 * Branded loading states — both spinner and skeleton variants.
 */

import { Shield } from 'lucide-react';

/** Full-page loading screen shown during auth initialization */
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 animate-spin-slow" />
        <div
          className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-emerald-500"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <Shield className="absolute inset-0 m-auto w-7 h-7 text-emerald-500" />
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">ShieldRoute</p>
    </div>
  );
}

/** Inline spinner */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-emerald-500/20 border-t-emerald-500 ${className}`}
      style={{ animation: 'spin 0.8s linear infinite' }}
    />
  );
}

/** Skeleton card for stat KPI boxes */
export function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-16" />
          <div className="skeleton skeleton-text w-24" />
        </div>
      </div>
      <div className="skeleton h-8 w-20 rounded-md mb-2" />
      <div className="skeleton skeleton-text w-28" />
    </div>
  );
}

/** Skeleton for claim/payout rows */
export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4 gap-4">
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-text w-32" />
        <div className="skeleton skeleton-text w-20" />
      </div>
      <div className="space-y-2 items-end flex flex-col">
        <div className="skeleton w-16 h-5 rounded" />
        <div className="skeleton w-12 h-4 rounded" />
      </div>
    </div>
  );
}

/** Skeleton weather row */
export function SkeletonWeatherRow() {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="skeleton skeleton-text w-20" />
      </div>
      <div className="skeleton w-16 h-5 rounded" />
    </div>
  );
}
