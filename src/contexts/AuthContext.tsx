import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Worker, supabase } from '../lib/supabase';

interface AuthContextType {
  worker: Worker | null;
  isAdmin: boolean;
  isReady: boolean;
  setWorker: (worker: Worker | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [worker, setWorkerState] = useState<Worker | null>(null);
  const [isAdmin, setIsAdminState] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedWorker = localStorage.getItem('shieldroute_worker');
      const savedAdmin = sessionStorage.getItem('shieldroute_admin');

      if (savedAdmin === 'true') {
        setIsAdminState(true);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData.session?.user?.id;

      if (!authUserId) {
        setWorkerState(null);
        localStorage.removeItem('shieldroute_worker');
        setIsReady(true);
        return;
      }

      if (savedWorker) {
        try {
          const parsed = JSON.parse(savedWorker) as Worker;
          if (parsed.id === authUserId) {
            setWorkerState(parsed);
            setIsReady(true);
            return;
          }
        } catch {
          // Ignore parse error and fall back to DB lookup
        }
      }

      const { data: workerData } = await supabase
        .from('workers')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (workerData) {
        setWorkerState(workerData);
        localStorage.setItem('shieldroute_worker', JSON.stringify(workerData));
      } else {
        setWorkerState(null);
        localStorage.removeItem('shieldroute_worker');
      }

      setIsReady(true);
    };

    initializeAuth().catch(() => {
      setIsReady(true);
    });
  }, []);

  const setWorker = (worker: Worker | null) => {
    setWorkerState(worker);
    if (worker) {
      localStorage.setItem('shieldroute_worker', JSON.stringify(worker));
    } else {
      localStorage.removeItem('shieldroute_worker');
    }
  };

  const setIsAdmin = (admin: boolean) => {
    setIsAdminState(admin);
    if (admin) {
      sessionStorage.setItem('shieldroute_admin', 'true');
    } else {
      sessionStorage.removeItem('shieldroute_admin');
    }
  };

  const logout = async () => {
    setWorkerState(null);
    setIsAdminState(false);
    localStorage.removeItem('shieldroute_worker');
    sessionStorage.removeItem('shieldroute_admin');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ worker, isAdmin, isReady, setWorker, setIsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
