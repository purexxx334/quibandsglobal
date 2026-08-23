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
  const { data, error } = await supabaseAdmin
    .from('security_logs')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('--- DB INSPECTION: security_logs ---');
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log(`Found ${data?.length || 0} security logs in database.`);
    data?.forEach((log, i) => {
      console.log(`[#${i + 1}] Event: ${log.event_type} | User: ${log.user_email} | IP: ${log.ip_address} | Time: ${log.created_at}`);
    });
  }
}

main();
