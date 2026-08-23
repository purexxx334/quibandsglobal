import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkTables() {
  console.log('Testing deposit_requests and user_notifications table availability...');
  const { data: depData, error: depError } = await supabaseAdmin.from('deposit_requests').select('*').limit(1);
  if (depError) {
    console.log('deposit_requests table status:', depError.message);
  } else {
    console.log('deposit_requests table is READY and active in Supabase!');
  }

  const { data: notifData, error: notifError } = await supabaseAdmin.from('user_notifications').select('*').limit(1);
  if (notifError) {
    console.log('user_notifications table status:', notifError.message);
  } else {
    console.log('user_notifications table is READY and active in Supabase!');
  }
}

checkTables();
