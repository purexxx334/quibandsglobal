import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const adminEmail = process.argv[2] || 'admin@quibandsglobal.com';
  const adminPassword = process.argv[3] || 'AdminPass2026!';
  const adminFullName = 'Quibands SuperAdmin';

  console.log(`\n======================================================`);
  console.log(`🔧 CREATING / VERIFYING ADMIN ACCOUNT`);
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  console.log(`======================================================\n`);

  try {
    // 1. Check if user already exists in auth.users
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    let existingUser = listData.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
    let userId: string;

    if (!existingUser) {
      console.log('⏳ Creating user in Supabase Auth...');
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Automatically verify email
        user_metadata: {
          full_name: adminFullName,
          username: 'admin',
        },
      });

      if (createError) {
        console.error('❌ Error creating user in auth.users:', createError.message);
        process.exit(1);
      }

      userId = created.user.id;
      console.log(`✅ Supabase Auth user created! (ID: ${userId})`);
    } else {
      userId = existingUser.id;
      console.log(`ℹ️ User already exists in auth.users (ID: ${userId}). Updating password & confirming email...`);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
      });

      if (updateError) {
        console.warn('⚠️ Could not update existing password:', updateError.message);
      } else {
        console.log('✅ Password and email confirmation verified.');
      }
    }

    // 2. Ensure Profile exists in public.profiles
    console.log('⏳ Ensuring profile record in public.profiles...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          auth_user_id: userId,
          email: adminEmail,
          full_name: adminFullName,
          username: 'admin',
          account_status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_user_id' }
      );

    if (profileError) {
      console.warn('⚠️ Note on profile upsert:', profileError.message);
    } else {
      console.log('✅ Profile record active in public.profiles.');
    }

    // 3. Ensure 'admin' role in public.user_roles
    console.log('⏳ Assigning admin role in public.user_roles...');
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        {
          user_id: userId,
          role: 'admin',
        },
        { onConflict: 'user_id, role' }
      );

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError.message);
      process.exit(1);
    }

    console.log('✅ Admin role successfully assigned in public.user_roles!');

    console.log(`\n======================================================`);
    console.log(`🎉 ADMIN ACCOUNT IS READY FOR LOGIN!`);
    console.log(`🌐 Application URL: http://localhost:5173/`);
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`======================================================\n`);
  } catch (err: any) {
    console.error('❌ Unexpected error during admin creation:', err.message);
    process.exit(1);
  }
}

createAdminUser();
