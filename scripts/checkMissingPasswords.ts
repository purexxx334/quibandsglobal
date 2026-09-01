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
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, auth_user_id, email, full_name, temp_password');
  console.log('--- USERS MISSING PASSWORD ---');
  profiles?.forEach(p => {
    if (!p.temp_password) {
      console.log(`Missing pass: ${p.email} (${p.full_name}) | auth_user_id: ${p.auth_user_id}`);
    } else {
      console.log(`Has pass: ${p.email} => "${p.temp_password}"`);
    }
  });
}

main();
