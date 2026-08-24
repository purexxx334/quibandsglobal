import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from '../server/config/supabase';

async function main() {
  console.log('--- TESTING PROFILES METADATA ---');
  
  const { data: profs, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, auth_user_id, email, metadata')
    .limit(3);

  if (profErr) {
    console.log('Notice on profiles.metadata:', profErr.message);
  } else {
    console.log('✓ profiles.metadata column is accessible! Sample:', profs);
  }
}

main().catch(console.error);
