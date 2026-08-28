import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://laawukhhdyxpveqdxeht.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYXd1a2hoZHl4cHZlcWR4ZWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MjA5NjUsImV4cCI6MjEwMjk5Njk2NX0.9bd5bovuSrAm3Jm4rHCfvdhf15k3ENHrWl-w2MohN7A';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder')
);

// Client-side Supabase instance (Using public anon key only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
