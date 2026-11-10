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
    // Deposit addresses are strictly managed via Admin Dashboard (no hardcoded seed addresses)
    console.log('✅ Skipping hardcoded deposit address seed (managed exclusively by Admin).');

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
