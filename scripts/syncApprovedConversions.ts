import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sync() {
  console.log('--- SYNCING ALL APPROVED CONVERSIONS ---');

  const { data: convs, error } = await supabaseAdmin
    .from('conversion_requests')
    .select('*')
    .eq('status', 'CONVERTED');

  if (error) {
    console.error('Error fetching conversions:', error);
    return;
  }

  console.log(`Found ${convs.length} approved conversions to apply.`);

  for (const c of convs) {
    console.log(`Processing user ${c.user_email} (${c.user_id}) -> ${c.converted_amount} ${c.target_currency}...`);

    // 1. Update profiles table: set convert_balance, set profit_balance = 0, mining_balance = 0
    const { error: pErr } = await supabaseAdmin
      .from('profiles')
      .update({
        convert_balance: Number(c.converted_amount),
        convert_currency: c.target_currency || 'SGD',
        profit_balance: 0,
        mining_balance: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', c.user_id);

    if (pErr) console.error(`Profile update error for ${c.user_email}:`, pErr);
    else console.log(`✓ Profile updated for ${c.user_email}`);

    // 2. Update wallets table: set balance = 0, profit_balance = 0, mining_balance = 0
    const { error: wErr } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: 0,
        profit_balance: 0,
        mining_balance: 0,
        available_balance: 0,
        realized_rewards: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', c.user_id);

    if (wErr) console.error(`Wallet update error for ${c.user_email}:`, wErr);
    else console.log(`✓ Wallet reset for ${c.user_email}`);
  }

  console.log('--- ALL CONVERSIONS SYNCED SUCCESSFULLY ---');
}

sync().catch(console.error);
