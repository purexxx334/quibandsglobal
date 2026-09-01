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
  const email = 'mikewalker298764@gmail.com';
  const pass = 'festus1234';
  
  const { data: prof } = await supabaseAdmin.from('profiles').select('id, auth_user_id').eq('email', email).maybeSingle();
  if (prof) {
    if (prof.auth_user_id) {
      await supabaseAdmin.auth.admin.updateUserById(prof.auth_user_id, { password: pass });
    }
    await supabaseAdmin.from('profiles').update({ temp_password: pass, updated_at: new Date().toISOString() }).eq('id', prof.id);
    console.log(`✓ Updated ${email} password to "${pass}"`);
  }
}

main();
