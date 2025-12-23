/*
  # Lock System Schema

  ## Overview
  Creates the database schema for a QR code-based lock system with real-time communication
  between lock screen and teacher mobile interfaces.

  ## New Tables
  
  ### `lock_sessions`
  - `id` (uuid, primary key) - Unique identifier for each lock session
  - `qr_code` (text) - Generated QR code data for authentication
  - `is_locked` (boolean) - Current lock status (true = locked, false = unlocked)
  - `emergency_code` (text) - Emergency unlock code
  - `created_at` (timestamptz) - Session creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `expires_at` (timestamptz) - QR code expiration time

  ### `unlock_logs`
  - `id` (uuid, primary key) - Unique identifier for each unlock event
  - `session_id` (uuid, foreign key) - Reference to lock session
  - `unlock_method` (text) - Method used to unlock (qr_scan or emergency_code)
  - `unlocked_at` (timestamptz) - Timestamp of unlock event
  - `unlocked_by` (text) - Identifier of who unlocked

  ## Security
  - Enable RLS on both tables
  - Public can read lock sessions (for display purposes)
  - Public can insert unlock logs (for tracking)
  - Public can update lock sessions (for unlock operations)
  - In production, these policies should be restricted to authenticated users
*/

CREATE TABLE IF NOT EXISTS lock_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code text NOT NULL,
  is_locked boolean DEFAULT true,
  emergency_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes')
);

CREATE TABLE IF NOT EXISTS unlock_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES lock_sessions(id) ON DELETE CASCADE,
  unlock_method text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  unlocked_by text DEFAULT 'anonymous'
);

ALTER TABLE lock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lock sessions"
  ON lock_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert lock sessions"
  ON lock_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update lock sessions"
  ON lock_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete expired lock sessions"
  ON lock_sessions FOR DELETE
  USING (expires_at < now());

CREATE POLICY "Anyone can read unlock logs"
  ON unlock_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert unlock logs"
  ON unlock_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lock_sessions_is_locked ON lock_sessions(is_locked);
CREATE INDEX IF NOT EXISTS idx_lock_sessions_expires_at ON lock_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_unlock_logs_session_id ON unlock_logs(session_id);