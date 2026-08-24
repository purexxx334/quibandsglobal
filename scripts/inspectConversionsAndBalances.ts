import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function inspect() {
  console.log('=== 1. CONVERSION REQUESTS ===');
  const { data: convs, error: convErr } = await supabaseAdmin
    .from('conversion_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (convErr) console.error('Conversions query error:', convErr);
  else console.log(JSON.stringify(convs, null, 2));

  console.log('\n=== 2. PROFILES (convert_balance, profit_balance) ===');
  const { data: profs, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, auth_user_id, email, full_name, profit_balance, convert_balance, convert_currency');
  if (profErr) console.error('Profiles query error:', profErr);
  else console.log(JSON.stringify(profs, null, 2));

  console.log('\n=== 3. WALLETS ===');
  const { data: wallets, error: walErr } = await supabaseAdmin
    .from('wallets')
    .select('*');
  if (walErr) console.error('Wallets query error:', walErr);
  else console.log(JSON.stringify(wallets, null, 2));
}

inspect().catch(console.error);
