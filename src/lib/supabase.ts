import { createClient } from '@supabase/supabase-js';

// 🔥 SENİN ANAHTARLARIN BURADA OLMALI
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';

// Typescript için veritabanı tiplerini tanımlayalım
export type LockSession = {
  id: number;
  created_at: string;
  qr_code: string;
  status: 'LOCKED' | 'OPEN';
  emergency_code: string;
  duration?: number;
  board_name?: string;
};

export const supabase = createClient(supabaseUrl, supabaseKey);