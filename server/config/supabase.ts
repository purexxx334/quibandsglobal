import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

const FALLBACK_SUPABASE_URL = 'https://laawukhhdyxpveqdxeht.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYXd1a2hoZHl4cHZlcWR4ZWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MjA5NjUsImV4cCI6MjEwMjk5Njk2NX0.9bd5bovuSrAm3Jm4rHCfvdhf15k3ENHrWl-w2MohN7A';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYXd1a2hoZHl4cHZlcWR4ZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQyMDk2NSwiZXhwIjoyMTAyOTk2OTY1fQ.68xW0AYRIgA2_UWeC7R7K4vpmglZdua413Zr5vKuAa4';

const targetUrl = env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const targetServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
const targetAnonKey = env.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Server-side Supabase client with admin capabilities (service_role)
export const supabaseAdmin: SupabaseClient = createClient(
  targetUrl,
  targetServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard Supabase client (anon) for user token verification
export const supabaseAnon: SupabaseClient = createClient(
  targetUrl,
  targetAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
