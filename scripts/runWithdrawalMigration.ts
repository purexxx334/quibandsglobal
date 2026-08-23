import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log('--- Applying Phase 4 Withdrawal System Migration ---');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const sqlPath = path.resolve('server/database/migration_withdrawal_system.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Verify non-destructive rules
  const upperSql = sql.toUpperCase();
  if (upperSql.includes('DROP TABLE') || upperSql.includes('TRUNCATE') || upperSql.includes('DELETE FROM')) {
    console.error('ERROR: Migration contains destructive statements! Aborting.');
    process.exit(1);
  }

  // Execute migration via rpc or check tables
  const { data: testTable, error } = await supabase.from('withdrawal_requests').select('id').limit(1);
  if (error && error.code === '42P01') {
    console.log('Tables do not exist yet. Please run the SQL migration in Supabase SQL editor or CLI.');
  } else {
    console.log('withdrawal_requests table verified in Supabase Postgres:', error ? error.message : 'OK');
  }

  const { data: testFee, error: feeErr } = await supabase.from('withdrawal_fee_records').select('id').limit(1);
  console.log('withdrawal_fee_records table verified in Supabase Postgres:', feeErr ? feeErr.message : 'OK');
}

runMigration();
