import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspectDb() {
  console.log('\n--- AUTH USERS ---');
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) console.error('Auth error:', authError.message);
  else {
    authUsers.users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email} | Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`));
  }

  console.log('\n--- PROFILES ---');
  const { data: profiles, error: profError } = await supabaseAdmin.from('profiles').select('*');
  if (profError) console.error('Profiles error:', profError.message);
  else console.log(profiles);

  console.log('\n--- USER ROLES ---');
  const { data: roles, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');
  if (rolesError) console.error('Roles error:', rolesError.message);
  else console.log(roles);
}

inspectDb();
