import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- Checking all user records ---');
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  const { data: secLogs } = await supabaseAdmin.from('security_logs').select('*');
  const { data: auditLogs } = await supabaseAdmin.from('audit_logs').select('*');

  console.log('Auth users count:', authList?.users?.length);
  authList?.users?.forEach(u => {
    console.log(`Auth user: ${u.email} | id: ${u.id} | meta:`, JSON.stringify(u.user_metadata));
  });

  console.log('\nProfiles count:', profiles?.length);
  profiles?.forEach(p => {
    console.log(`Profile: ${p.email} | phone: ${p.phone_number} | temp_password: "${p.temp_password}" | meta:`, JSON.stringify(p.metadata));
  });

  console.log('\nSecurity logs matching pass/auth:');
  secLogs?.forEach(l => {
    if (l.event_type?.includes('login') || l.details?.password || l.details?.temp_password) {
      console.log(`Log: ${l.user_email} | event: ${l.event_type} | details:`, JSON.stringify(l.details));
    }
  });

  console.log('\nAudit logs:');
  auditLogs?.forEach(a => {
    console.log(`Audit: ${a.action} | details:`, JSON.stringify(a.details));
  });
}

main().catch(console.error);
