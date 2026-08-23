import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkUsers() {
  console.log('\n--- 1. AUTH USERS via supabaseAdmin.auth.admin.listUsers() ---');
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) console.error('Auth error:', authError);
  else console.log(`Found ${authUsers.users.length} auth users:`, authUsers.users.map(u => ({ id: u.id, email: u.email })));

  console.log('\n--- 2. PROFILES via supabaseAdmin.from("profiles").select("*") ---');
  const { data: profiles, error: profError } = await supabaseAdmin.from('profiles').select('*');
  if (profError) console.error('Profiles error:', profError);
  else console.log(`Found ${profiles?.length || 0} profiles:`, profiles);

  console.log('\n--- 3. USER ROLES via supabaseAdmin.from("user_roles").select("*") ---');
  const { data: roles, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');
  if (rolesError) console.error('Roles error:', rolesError);
  else console.log(`Found ${roles?.length || 0} roles:`, roles);
}

checkUsers();
