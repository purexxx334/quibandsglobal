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
  const emails = ['luqmannjefryy@gmail.com', 'dorfkindphillip@gmail.com', 'test_1788069813128@gmail.com', 'djtiestomichiel@gmail.com', 'chenyuheng999@gmail.com'];
  const { data: profs } = await supabaseAdmin.from('profiles').select('*').in('email', emails);
  console.log('Target user profiles:');
  console.log(JSON.stringify(profs, null, 2));
}

main();
