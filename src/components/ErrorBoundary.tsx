import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 text-center animate-scale-in border-red-500/20 shadow-[-10px_0_30px_rgba(239,68,68,0.1)]">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-sm">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="bg-slate-900 rounded p-4 mb-6 overflow-hidden text-left border border-slate-800">
               <p className="text-xs text-red-400 font-mono break-all line-clamp-3">
                 {this.state.error?.message || "Unknown error"}
               </p>
            </div>
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
