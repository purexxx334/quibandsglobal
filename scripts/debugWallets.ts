import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Check users
  const { data: users } = await supabase.from('profiles').select('*').limit(5);
  console.log('Sample Profiles:', users);

  // Check wallets
  const { data: wallets, error: wErr } = await supabase.from('wallets').select('*').limit(5);
  console.log('Wallets Error:', wErr);
  console.log('Sample Wallets:', wallets);

  // Check withdrawal requests
  const { data: wds, error: wdErr } = await supabase.from('withdrawal_requests').select('*').limit(5);
  console.log('Withdrawal requests error:', wdErr);
  console.log('Sample Withdrawals:', wds);
}

run();
