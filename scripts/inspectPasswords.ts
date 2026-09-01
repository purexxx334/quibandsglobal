import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, auth_user_id, email, phone_number, full_name, temp_password, metadata, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Total profiles: ${profiles?.length}`);
  profiles?.forEach((p, idx) => {
    console.log(`[${idx + 1}] Email: ${p.email} | Phone: ${p.phone_number} | Pass: "${p.temp_password}" | MetaPass: "${p.metadata?.password || p.metadata?.temp_password || ''}"`);
  });
}

main();
