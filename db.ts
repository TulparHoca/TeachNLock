/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// .env dosyasından bilgileri okur
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL veya Key bulunamadı! .env dosyasını kontrol et.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);