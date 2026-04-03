/*
  # ShieldRoute Database Schema
  
  1. New Tables
    - `workers`
      - `id` (uuid, primary key)
      - `phone` (text, unique) - Worker's phone number
      - `name` (text) - Worker's name
      - `partner_id` (text) - Zomato/Swiggy partner ID
      - `platform` (text) - Zomato or Swiggy
      - `zone` (text) - Delivery zone
      - `weekly_earnings` (integer) - Self-declared weekly earnings
      - `risk_score` (integer) - AI-calculated risk score (0-100)
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `policies`
      - `id` (uuid, primary key)
      - `worker_id` (uuid, foreign key to workers)
      - `plan_type` (text) - Basic, Standard, or Plus
      - `base_premium` (integer) - Base weekly premium in rupees
      - `final_premium` (integer) - Calculated final premium
      - `coverage_triggers` (jsonb) - Array of covered trigger types
      - `max_payout` (integer) - Maximum payout amount
      - `status` (text) - active, expired, cancelled
      - `start_date` (timestamptz) - Policy start date
      - `end_date` (timestamptz) - Policy end date
      - `weeks_covered` (integer) - Total weeks covered
      - `total_premium_paid` (integer) - Total premium paid
      - `created_at` (timestamptz)
    
    - `claims`
      - `id` (uuid, primary key)
      - `worker_id` (uuid, foreign key to workers)
      - `policy_id` (uuid, foreign key to policies)
      - `trigger_type` (text) - T01, T02, T03, T04, T05
      - `trigger_name` (text) - Heavy Rainfall, Extreme Heat, etc.
      - `amount` (integer) - Payout amount in rupees
      - `status` (text) - approved, pending, rejected
      - `fraud_score` (integer) - Fraud detection score (0-100)
      - `fraud_flags` (jsonb) - Details of fraud detection
      - `created_at` (timestamptz)
    
    - Note: admin authentication should be handled outside public tables
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Workers can only access their own data
    - Admins have full access
*/

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  partner_id text NOT NULL,
  platform text NOT NULL,
  zone text NOT NULL,
  weekly_earnings integer NOT NULL,
  risk_score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  base_premium integer NOT NULL,
  final_premium integer NOT NULL,
  coverage_triggers jsonb NOT NULL DEFAULT '[]',
  max_payout integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  weeks_covered integer DEFAULT 1,
  total_premium_paid integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_name text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  fraud_score integer NOT NULL,
  fraud_flags jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Worker rows are scoped to the authenticated user id.
CREATE POLICY "Workers can read own profile"
  ON workers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Workers can insert own profile"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Workers can update own profile"
  ON workers FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Workers can delete own profile"
  ON workers FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- Policy rows must belong to authenticated owner.
CREATE POLICY "Workers can read own policies"
  ON policies FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can insert own policies"
  ON policies FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update own policies"
  ON policies FOR UPDATE
  TO authenticated
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can delete own policies"
  ON policies FOR DELETE
  TO authenticated
  USING (worker_id = auth.uid());

-- Claim rows are limited to authenticated owner.
CREATE POLICY "Workers can read own claims"
  ON claims FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can insert own claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update own claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can delete own claims"
  ON claims FOR DELETE
  TO authenticated
  USING (worker_id = auth.uid());

-- Insert mock historical data for demo
INSERT INTO workers (phone, name, partner_id, platform, zone, weekly_earnings, risk_score)
VALUES ('9876543210', 'Ravi Kumar', 'ZOM-BLR-2847', 'Zomato', 'Koramangala', 4800, 70)
ON CONFLICT (phone) DO NOTHING;
