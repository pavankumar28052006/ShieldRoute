/**
 * Toast.tsx
 * Lightweight toast notification system replacing all alert() calls.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-400    flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />,
  info:    <Info       className="w-5 h-5 text-blue-400   flex-shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error:   'border-red-500/30    bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info:    'border-blue-500/30   bg-blue-500/10',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 350);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration ?? 4000);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border glass max-w-sm w-full shadow-2xl
        ${STYLES[toast.type]}
        ${exiting ? 'animate-slide-in-right opacity-0 translate-x-full' : 'animate-slide-in-right'}
        transition-all duration-300`}
      style={{ animationFillMode: 'both' }}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={dismiss}
        className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, msg?: string) => add('success', title, msg),
    error:   (title: string, msg?: string) => add('error',   title, msg),
    warning: (title: string, msg?: string) => add('warning', title, msg),
    info:    (title: string, msg?: string) => add('info',    title, msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType['toast'] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx.toast;
}
