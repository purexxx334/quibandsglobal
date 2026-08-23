import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRUST_PROXY: process.env.TRUST_PROXY ? (process.env.TRUST_PROXY === 'true' ? true : parseInt(process.env.TRUST_PROXY, 10)) : 1,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

// Validate critical variables on startup
export function validateEnv() {
  const missing: string[] = [];

  if (!env.SUPABASE_URL) {
    missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
  }
  if (!env.SUPABASE_ANON_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length > 0) {
    console.warn(`\n⚠️  [WARN] Missing environment variables: ${missing.join(', ')}`);
    console.warn(`👉 Please set them in your .env file. See .env.example for details.\n`);
  }
}
