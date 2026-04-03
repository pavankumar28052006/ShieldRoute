import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Worker {
  id: string;
  phone: string;
  name: string;
  partner_id: string;
  platform: string;
  zone: string;
  weekly_earnings: number;
  risk_score: number;
  created_at: string;
}

export interface Policy {
  id: string;
  worker_id: string;
  plan_type: string;
  base_premium: number;
  final_premium: number;
  coverage_triggers: string[];
  max_payout: number;
  status: string;
  start_date: string;
  end_date: string;
  weeks_covered: number;
  total_premium_paid: number;
  created_at: string;
}

export interface Claim {
  id: string;
  worker_id: string;
  policy_id: string;
  trigger_type: string;
  trigger_name: string;
  amount: number;
  status: string;
  fraud_score: number;
  fraud_flags: Record<string, unknown>;
  created_at: string;
}
