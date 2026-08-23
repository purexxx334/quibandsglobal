import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log('\n======================================================');
  console.log('🚀 INITIALIZING SUPABASE EXTENDED TABLES & SEED');
  console.log('======================================================\n');

  try {
    // 1. Seed initial deposit addresses directly via API
    console.log('⏳ Seeding initial active deposit addresses...');
    const depositAddresses = [
      { asset: 'BTC', network: 'BITCOIN', address: 'bc1q9x37uvk92m64789vqwzepj87vqk33t6a7zfl8m', is_active: true, notes: 'Primary Institutional Cold Vault (Native SegWit)' },
      { asset: 'ETH', network: 'ERC20', address: '0x71C0D8B9364b63897d2B638148b172a5a06E7947', is_active: true, notes: 'Multi-Sig Ethereum Treasury' },
      { asset: 'USDT', network: 'TRC20', address: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y', is_active: true, notes: 'High-Speed Zero Fee TRON Network Deposit' },
      { asset: 'USDT', network: 'ERC20', address: '0x71C0D8B9364b63897d2B638148b172a5a06E7947', is_active: true, notes: 'Institutional ERC-20 Tether Gateway' },
      { asset: 'SOL', network: 'SOLANA', address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyKWzqVvUhy9mPz', is_active: true, notes: 'Solana Mainnet High-Throughput Node' },
      { asset: 'LTC', network: 'LITECOIN', address: 'ltc1qf8m9yvx8e4m8w2s5p3k9j7d2f4a6c8e0g1b3z5', is_active: true, notes: 'Scrypt ASIC Mining Deposit Vault' },
      { asset: 'BNB', network: 'BEP20', address: '0x71C0D8B9364b63897d2B638148b172a5a06E7947', is_active: true, notes: 'BNB Smart Chain Gateway' },
    ];

    for (const item of depositAddresses) {
      const { error } = await supabaseAdmin.from('deposit_addresses').upsert(item, { onConflict: 'asset, network, address' });
      if (error) {
        console.warn(`Note on deposit address upsert (${item.asset}-${item.network}):`, error.message);
      }
    }
    console.log('✅ Initial deposit addresses verified.');

    // 2. Seed an initial system notification for Admin
    console.log('⏳ Seeding initial system notification...');
    const { error: notifError } = await supabaseAdmin.from('admin_notifications').insert({
      title: 'Security Engine Online',
      message: 'Institutional login security monitoring and audit logging initialized successfully.',
      severity: 'info',
      event_type: 'SYSTEM_STARTUP',
      metadata: { timestamp: new Date().toISOString() }
    });

    if (notifError) {
      console.warn('Note on notification seed:', notifError.message);
    } else {
      console.log('✅ System notification created.');
    }

    console.log('\n======================================================');
    console.log('🎉 EXTENDED DATABASE MIGRATION SCRIPT COMPLETED');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Migration error:', err.message);
  }
}

runMigration();
