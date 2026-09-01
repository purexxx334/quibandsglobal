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
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('--- 5 Latest Profiles ---');
  profiles?.forEach(p => {
    console.log(`Email: ${p.email} | temp_pass: "${p.temp_password}" | phone: ${p.phone_number} | created: ${p.created_at} | meta:`, p.metadata);
  });
}

main();
