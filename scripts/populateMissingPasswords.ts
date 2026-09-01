import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const passwordAssignments: Record<string, string> = {
  'luqmannjefryy@gmail.com': 'Luqman2026!',
  'dorfkindphillip@gmail.com': 'Great2026!',
  'eucserver.io@gmail.com': 'festus1234',
  'fosabor@gmail.com': 'festus1234',
  'test_1788069813128@gmail.com': 'TestUser2026!',
  'forticard20@gmail.com': 'festus1234',
  'testuser@quibands.com': 'TestUser2026!',
  'trader_wd_test1@quibands.com': 'TestUser2026!',
  'trader_wd_test2@quibands.com': 'TestUser2026!',
  'admin@quibandsglobal.com': 'AdminPass2026!',
};

async function main() {
  console.log('--- Setting Passwords for Unset Users ---');
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, auth_user_id, email, temp_password');
  
  for (const p of (profiles || [])) {
    if (!p.temp_password && passwordAssignments[p.email]) {
      const assignedPass = passwordAssignments[p.email];
      console.log(`Setting password for ${p.email} -> "${assignedPass}"...`);

      // 1. Update auth.users
      if (p.auth_user_id) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(p.auth_user_id, {
          password: assignedPass,
        });
        if (authErr) {
          console.warn(`Auth update error for ${p.email}:`, authErr.message);
        }
      }

      // 2. Update profiles table
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({
          temp_password: assignedPass,
          updated_at: new Date().toISOString(),
        })
        .or(`auth_user_id.eq.${p.auth_user_id},id.eq.${p.id}`);

      if (profErr) {
        console.error(`Profile update error for ${p.email}:`, profErr.message);
      } else {
        console.log(`✓ Successfully updated ${p.email} with password "${assignedPass}"`);
      }
    }
  }

  console.log('\n--- Final Verification ---');
  const { data: updatedProfiles } = await supabaseAdmin.from('profiles').select('email, temp_password');
  updatedProfiles?.forEach(p => {
    console.log(`User: ${p.email.padEnd(35)} | Password: ${p.temp_password || 'NULL'}`);
  });
}

main();
