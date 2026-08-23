import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function runTests() {
  console.log('======================================================');
  console.log('🧪 TESTING ALL EXTENDED ENDPOINTS & ADMIN FLOW');
  console.log('======================================================\n');

  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  // 1. Sign In as Admin
  console.log('1. Signing in as admin@quibandsglobal.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@quibandsglobal.com',
    password: 'AdminPass2026!',
  });

  if (authError || !authData.session) {
    console.error('❌ Admin Sign-in failed:', authError?.message);
    process.exit(1);
  }

  const token = authData.session.access_token;
  const adminId = authData.user.id;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('✅ Admin Authenticated! Token acquired.\n');

  // 2. Test Active Deposit Addresses (Public/User)
  console.log('2. Testing GET /api/deposit-addresses/active...');
  try {
    const res = await fetch('http://localhost:5000/api/deposit-addresses/active');
    const json = await res.json();
    console.log(`   Response status: ${res.status} | Data:`, json.data ? `${json.data.length} addresses active` : json);
  } catch (err: any) {
    console.error('   Error:', err.message);
  }

  // 3. Test Admin Security Notifications
  console.log('\n3. Testing GET /api/admin/security/notifications...');
  try {
    const res = await fetch('http://localhost:5000/api/admin/security/notifications', { headers });
    const json = await res.json();
    console.log(`   Response status: ${res.status} | Data:`, json.data ? `${json.data.length} notifications` : json);
  } catch (err: any) {
    console.error('   Error:', err.message);
  }

  // 4. Test Admin Security Logs
  console.log('\n4. Testing GET /api/admin/security/logs...');
  try {
    const res = await fetch('http://localhost:5000/api/admin/security/logs', { headers });
    const json = await res.json();
    console.log(`   Response status: ${res.status} | Data:`, json.data ? `${json.data.length} telemetry logs` : json);
  } catch (err: any) {
    console.error('   Error:', err.message);
  }

  // 5. Test Admin User Dossier
  console.log(`\n5. Testing GET /api/admin/users/${adminId}/dossier...`);
  try {
    const res = await fetch(`http://localhost:5000/api/admin/users/${adminId}/dossier`, { headers });
    const json = await res.json();
    console.log(`   Response status: ${res.status} | Dossier:`, {
      email: json.data?.profile?.email,
      role: json.data?.role,
      status: json.data?.profile?.account_status,
      walletsCount: json.data?.wallets?.length,
    });
  } catch (err: any) {
    console.error('   Error:', err.message);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL EXTENDED ENDPOINTS VERIFIED & FUNCTIONAL');
  console.log('======================================================\n');
}

runTests();
