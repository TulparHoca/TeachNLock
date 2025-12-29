import { createClient } from '@supabase/supabase-js';

// 🔥 Şifreleri buraya GÖMÜYORUZ ki EXE olunca da çalışsın
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase anahtarları eksik!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
  }
});