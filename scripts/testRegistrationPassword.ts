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
  console.log('--- Testing Registration Flow ---');
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  const testPass = 'MyEnteredPass123!';
  const testName = 'Test Registration';

  // 1. Simulate AuthController.register
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPass,
    email_confirm: true,
    user_metadata: {
      full_name: testName,
      temp_password: testPass,
    },
  });

  if (createError) {
    console.error('Create error:', createError);
    return;
  }

  // 2. Insert into profiles with temp_password
  const { error: profError } = await supabaseAdmin.from('profiles').upsert({
    auth_user_id: userData.user.id,
    email: testEmail,
    full_name: testName,
    account_status: 'active',
    temp_password: testPass,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'auth_user_id' });

  if (profError) {
    console.error('Profile error:', profError);
    return;
  }

  // 3. Verify profile
  const { data: prof } = await supabaseAdmin.from('profiles').select('*').eq('auth_user_id', userData.user.id).single();
  console.log('Verified Profile saved password:', prof.temp_password);
  if (prof.temp_password === testPass) {
    console.log('✓ TEST PASSED: User entered password is saved and verified in profiles!');
  } else {
    console.error('❌ TEST FAILED: Password mismatch');
  }

  // Clean up test user
  await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
  await supabaseAdmin.from('profiles').delete().eq('auth_user_id', userData.user.id);
  console.log('Cleaned up test user.');
}

main();
