import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-side Supabase client with admin capabilities (service_role)
// NEVER expose the service role key to client-side frontend code.
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard Supabase client (anon) for user token verification
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
