import { createClient } from '@supabase/supabase-js';

// Vite env değişkenlerini okuma yöntemi import.meta.env şeklindedir
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL veya Key bulunamadı! .env dosyasını kontrol et.');
}
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: false, // <-- BU KESİNLİKLE FALSE OLMALI
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
  }
});