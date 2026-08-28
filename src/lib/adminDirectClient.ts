import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://laawukhhdyxpveqdxeht.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYXd1a2hoZHl4cHZlcWR4ZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQyMDk2NSwiZXhwIjoyMTAyOTk2OTY1fQ.68xW0AYRIgA2_UWeC7R7K4vpmglZdua413Zr5vKuAa4';

// High-privilege administrative Supabase client for zero-latency direct operations
export const adminDirectClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
