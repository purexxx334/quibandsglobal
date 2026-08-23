import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function runWithdrawalTests() {
  console.log('================================================================');
  console.log('   PHASE 4 — 17-STEP AUTOMATED WITHDRAWAL SYSTEM TEST SUITE     ');
  console.log('================================================================\n');

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testNum: number, desc: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${desc}`);
      if (detail) console.log(`       ↳ ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${testNum}: ${desc}`);
      if (detail) console.error(`       ↳ Error: ${detail}`);
      failed++;
    }
  }

  // 1. Setup Test Users & Fund User Wallets
  console.log('--- Setting up Test Users & Seed Wallets ---');
  const user1Email = 'trader_wd_test1@quibands.com';
  const user2Email = 'trader_wd_test2@quibands.com';
  const adminEmail = 'admin@quibandsglobal.com';
  const password = 'TestUserPass2026!';
  const adminPassword = 'AdminPass2026!';

  // Create User 1
  let { data: u1Auth } = await supabaseAnon.auth.signInWithPassword({ email: user1Email, password });
  if (!u1Auth.session) {
    const reg = await supabaseAnon.auth.signUp({ email: user1Email, password });
    u1Auth = reg.data;
  }
  const u1Token = u1Auth.session?.access_token!;
  const u1Id = u1Auth.user?.id!;

  // Create User 2 (for unauthorized access check)
  let { data: u2Auth } = await supabaseAnon.auth.signInWithPassword({ email: user2Email, password });
  if (!u2Auth.session) {
    const reg = await supabaseAnon.auth.signUp({ email: user2Email, password });
    u2Auth = reg.data;
  }
  const u2Token = u2Auth.session?.access_token!;
  const u2Id = u2Auth.user?.id!;

  // Login Admin
  const { data: adminAuth } = await supabaseAnon.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  const adminToken = adminAuth.session?.access_token!;
  const adminId = adminAuth.user?.id!;

  // Seed User 1 wallet with 1000 USDT
  const { data: wallet1 } = await supabaseAdmin.from('wallets').upsert({
    user_id: u1Id,
    currency: 'USDT',
    balance: 1000,
    locked_balance: 0,
    is_active: true
  }, { onConflict: 'user_id,currency' }).select().single();

  console.log(`User 1 (${user1Email}) initialized with 1000 USDT. Token acquired.`);
  console.log(`Admin (${adminEmail}) authenticated. Token acquired.\n`);

  let withdrawal1Id = '';
  let withdrawal2Id = '';

  // TEST 1: User creates withdrawal request -> PENDING
  try {
    const res = await fetch(`${API_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u1Token}` },
      body: JSON.stringify({
        asset: 'USDT',
        network: 'TRC20',
        destinationAddress: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AmyW7',
        amount: 200
      })
    });
    const json = await res.json();
    withdrawal1Id = json.data?.id;
    assert(res.status === 201 && json.data?.status === 'PENDING', 1, 'User creates withdrawal request -> PENDING', `Withdrawal ID: ${withdrawal1Id}, Status: ${json.data?.status}`);
  } catch (err: any) {
    assert(false, 1, 'User creates withdrawal request -> PENDING', err.message);
  }

  // TEST 2: Correct 20% withdrawal fee calculated server-side
  try {
    const { data: wd } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', withdrawal1Id).single();
    const fee = Number(wd?.fee_amount);
    assert(fee === 40, 2, 'Correct 20% platform withdrawal fee calculated server-side', `Gross: ${wd?.amount}, Fee (20%): ${fee} USDT`);
  } catch (err: any) {
    assert(false, 2, 'Correct 20% platform withdrawal fee calculated server-side', err.message);
  }

  // TEST 3: Correct net amount calculated server-side (Amount - Fee)
  try {
    const { data: wd } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', withdrawal1Id).single();
    const net = Number(wd?.net_amount);
    assert(net === 160, 3, 'Correct net payout calculated server-side', `Gross: 200 - 40 Fee = Net: ${net} USDT`);
  } catch (err: any) {
    assert(false, 3, 'Correct net payout calculated server-side', err.message);
  }

  // TEST 4: Insufficient balance rejected
  try {
    const res = await fetch(`${API_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u1Token}` },
      body: JSON.stringify({
        asset: 'USDT',
        network: 'TRC20',
        destinationAddress: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AmyW7',
        amount: 50000 // Exceeds available balance
      })
    });
    const json = await res.json();
    assert(res.status === 400 && json.success === false, 4, 'Insufficient available balance rejected', `Response: ${json.error}`);
  } catch (err: any) {
    assert(false, 4, 'Insufficient available balance rejected', err.message);
  }

  // TEST 5: Double-spend / race condition prevented (funds locked atomically)
  try {
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', u1Id).eq('currency', 'USDT').single();
    const available = Number(wallet.balance) - Number(wallet.locked_balance);
    assert(Number(wallet.locked_balance) >= 200 && available <= 800, 5, 'Double-spend prevented (Funds locked in wallet)', `Total: ${wallet.balance}, Locked: ${wallet.locked_balance}, Available: ${available}`);
  } catch (err: any) {
    assert(false, 5, 'Double-spend prevented (Funds locked in wallet)', err.message);
  }

  // TEST 6: Admin sees pending withdrawal
  try {
    const res = await fetch(`${API_URL}/admin/withdrawals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    const found = json.data?.find((w: any) => w.id === withdrawal1Id);
    assert(res.status === 200 && !!found, 6, 'Admin retrieves pending withdrawal in overview', `Found withdrawal ${withdrawal1Id} in list of ${json.data?.length} records`);
  } catch (err: any) {
    assert(false, 6, 'Admin retrieves pending withdrawal in overview', err.message);
  }

  // TEST 7: Admin approves withdrawal -> APPROVED, ledger debited (Net + Fee), audit log created
  try {
    const res = await fetch(`${API_URL}/admin/withdrawals/${withdrawal1Id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    const { data: wd } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', withdrawal1Id).single();
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', u1Id).eq('currency', 'USDT').single();
    const { data: ledgerEntries } = await supabaseAdmin.from('financial_ledgers').select('*').eq('reference_id', withdrawal1Id);
    
    assert(
      res.status === 200 && 
      wd.status === 'APPROVED' && 
      Number(wallet.balance) === 800 && 
      Number(wallet.locked_balance) === 0 &&
      ledgerEntries && ledgerEntries.length >= 2,
      7, 
      'Admin approves withdrawal -> APPROVED, wallet debited, ledger journaled',
      `Status: ${wd.status}, Balance: ${wallet.balance}, Locked: ${wallet.locked_balance}, Ledger Entries: ${ledgerEntries?.length}`
    );
  } catch (err: any) {
    assert(false, 7, 'Admin approves withdrawal -> APPROVED', err.message);
  }

  // TEST 8: Double approval blocked
  try {
    const res = await fetch(`${API_URL}/admin/withdrawals/${withdrawal1Id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    assert(res.status === 400 || json.success === false, 8, 'Double approval blocked safely', `Response: ${json.error}`);
  } catch (err: any) {
    assert(false, 8, 'Double approval blocked safely', err.message);
  }

  // Create second withdrawal for Rejection Test
  try {
    const res = await fetch(`${API_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u1Token}` },
      body: JSON.stringify({
        asset: 'USDT',
        network: 'TRC20',
        destinationAddress: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AmyW7',
        amount: 100
      })
    });
    const json = await res.json();
    withdrawal2Id = json.data?.id;
  } catch (err: any) {}

  // TEST 9: Admin rejects withdrawal with mandatory reason -> REJECTED
  try {
    const res = await fetch(`${API_URL}/admin/withdrawals/${withdrawal2Id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Compliance audit: destination address flagged in sanctions test' })
    });
    const json = await res.json();
    const { data: wd } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', withdrawal2Id).single();
    assert(
      res.status === 200 && wd.status === 'REJECTED' && wd.rejection_reason?.includes('Compliance audit'),
      9,
      'Admin rejects withdrawal with reason -> REJECTED',
      `Status: ${wd.status}, Reason: ${wd.rejection_reason}`
    );
  } catch (err: any) {
    assert(false, 9, 'Admin rejects withdrawal with reason -> REJECTED', err.message);
  }

  // TEST 10: Rejected withdrawal unlocks funds back to available balance
  try {
    const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', u1Id).eq('currency', 'USDT').single();
    assert(
      Number(wallet.balance) === 800 && Number(wallet.locked_balance) === 0,
      10,
      'Rejected withdrawal restored locked funds to available balance',
      `Wallet Balance: ${wallet.balance}, Locked: ${wallet.locked_balance}`
    );
  } catch (err: any) {
    assert(false, 10, 'Rejected withdrawal restored locked funds', err.message);
  }

  // TEST 11: Fee/Gas separate approval workflow works
  try {
    const feeRes = await fetch(`${API_URL}/admin/withdrawal-fees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const feeJson = await feeRes.json();
    const firstFee = feeJson.data?.[0];
    
    let reviewSuccess = false;
    if (firstFee) {
      const reviewRes = await fetch(`${API_URL}/admin/withdrawal-fees/${firstFee.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'APPROVED', notes: 'Platform fee verified' })
      });
      const reviewJson = await reviewRes.json();
      reviewSuccess = reviewJson.success;
    }
    assert(feeRes.status === 200 && reviewSuccess, 11, 'Gas/Fee separate approval workflow functional', `Fee records: ${feeJson.data?.length}, Reviewed: ${firstFee?.id}`);
  } catch (err: any) {
    assert(false, 11, 'Gas/Fee separate approval workflow functional', err.message);
  }

  // TEST 12: Normal user cannot access admin withdrawal endpoints (401/403)
  try {
    const res = await fetch(`${API_URL}/admin/withdrawals`, {
      headers: { Authorization: `Bearer ${u1Token}` }
    });
    assert(res.status === 403 || res.status === 401, 12, 'Normal user blocked from admin withdrawal endpoints (403)', `HTTP Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 12, 'Normal user blocked from admin withdrawal endpoints', err.message);
  }

  // TEST 13: User can retrieve own withdrawal history
  try {
    const res = await fetch(`${API_URL}/withdrawals`, {
      headers: { Authorization: `Bearer ${u1Token}` }
    });
    const json = await res.json();
    assert(res.status === 200 && Array.isArray(json.data) && json.data.length >= 2, 13, 'User can retrieve own withdrawal history', `Total user withdrawals returned: ${json.data?.length}`);
  } catch (err: any) {
    assert(false, 13, 'User can retrieve own withdrawal history', err.message);
  }

  // TEST 14: User cannot view another user withdrawal
  try {
    const res = await fetch(`${API_URL}/withdrawals/${withdrawal1Id}`, {
      headers: { Authorization: `Bearer ${u2Token}` } // User 2 trying to view User 1 withdrawal
    });
    assert(res.status === 404 || res.status === 403, 14, 'User cannot view another user withdrawal record', `HTTP Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 14, 'User cannot view another user withdrawal record', err.message);
  }

  // TEST 15: Financial ledger and audit logs created properly
  try {
    const { data: auditLogs } = await supabaseAdmin.from('audit_logs').select('*').eq('target_id', withdrawal1Id);
    const { data: ledgers } = await supabaseAdmin.from('financial_ledgers').select('*').eq('reference_id', withdrawal1Id);
    assert(
      auditLogs && auditLogs.length > 0 && ledgers && ledgers.length >= 2,
      15,
      'Financial ledger debits and admin audit logs created',
      `Audit logs: ${auditLogs?.length}, Ledger debits: ${ledgers?.length}`
    );
  } catch (err: any) {
    assert(false, 15, 'Financial ledger and audit logs created properly', err.message);
  }

  // TEST 16: Existing deposit functionality remains intact
  try {
    const depRes = await fetch(`${API_URL}/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u1Token}` },
      body: JSON.stringify({
        asset: 'USDT',
        network: 'TRC20',
        amount: 50,
        transactionHash: '0x' + Date.now().toString(16)
      })
    });
    const depJson = await depRes.json();
    assert(depRes.status === 201 && depJson.data?.status === 'PENDING', 16, 'Existing deposit creation functionality intact', `Deposit ID: ${depJson.data?.id}`);
  } catch (err: any) {
    assert(false, 16, 'Existing deposit functionality intact', err.message);
  }

  // TEST 17: Existing admin functionality and login telemetry intact
  try {
    const usersRes = await fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const logsRes = await fetch(`${API_URL}/admin/security/logs`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const usersJson = await usersRes.json();
    const logsJson = await logsRes.json();
    assert(
      usersRes.status === 200 && logsRes.status === 200 && usersJson.success && logsJson.success,
      17,
      'Existing admin user management & telemetry systems intact',
      `Users query: OK, Security logs query: OK (${logsJson.data?.length} records)`
    );
  } catch (err: any) {
    assert(false, 17, 'Existing admin functionality intact', err.message);
  }

  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passed} / 17 PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWithdrawalTests();
