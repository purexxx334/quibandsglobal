import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  
  console.log('1. Signing in as admin@quibandsglobal.com...');
  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email: 'admin@quibandsglobal.com',
    password: 'AdminPass2026!'
  });

  if (error) {
    console.error('Sign in failed:', error.message);
    return;
  }

  console.log('2. Emitting login telemetry event...');
  const telRes = await fetch('http://localhost:5000/api/security/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: auth.user.id,
      userEmail: auth.user.email,
      eventType: 'login_success',
      status: 'success',
      authMethod: 'email_password'
    })
  });
  console.log('Telemetry POST response:', telRes.status, await telRes.json());

  console.log('\n3. Fetching GET /api/admin/security/logs...');
  const logsRes = await fetch('http://localhost:5000/api/admin/security/logs', {
    headers: { Authorization: 'Bearer ' + auth.session.access_token }
  });
  console.log('Security logs response:', logsRes.status, await logsRes.json());
}

run();
