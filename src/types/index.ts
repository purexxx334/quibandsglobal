export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  priceUsd: number;
  change24h: number;
  hashrate: string;
  algorithm: string;
  network: string;
  minDeposit: string;
  estDailyYieldRate: number; // variable est. rate percentage for calculation
  iconColor: string;
}

export interface MiningCalculation {
  cryptoId: string;
  hashrateAmount: number;
  unit: string;
  estimatedDailyUsd: number;
  estimatedMonthlyUsd: number;
  estimatedCryptoPerDay: number;
  powerEfficiencyJoule: number;
}

export interface PlatformStat {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'mining' | 'security' | 'financial' | 'general';
}

export type AuthMode = 'login' | 'register';


export type UserRole = 'user' | 'admin' | 'moderator';

export type AccountStatus = 'active' | 'suspended' | 'pending' | 'flagged';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type KycDocumentType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE';

export interface KycSubmission {
  id: string;
  user_id: string;
  document_type: KycDocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  country: string;
  address: string;
  city?: string;
  postal_code?: string;
  id_front_url: string;
  id_back_url?: string | null;
  selfie_url: string;
  status: KycStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  phone_number?: string | null;
  account_status: AccountStatus;
  is_flagged?: boolean;
  flag_reason?: string | null;
  avatar_url?: string | null;
  kyc_status?: KycStatus;
  country?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  dob?: string | null;
  main_balance?: number;
  mining_balance?: number;
  profit_balance?: number;
  convert_balance?: number;
  convert_currency?: string;
  total_balance?: number;
  total_deposited?: number;
  receive_limit?: number;
  account_tier?: string;
  balance_remark?: string | null;
  mining_remark?: string | null;
  profit_remark?: string | null;
  temp_password?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_earnings?: number;
  referral_count?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  role?: UserRole;
}



export interface UserDossier {
  profile: UserProfile;
  wallets: Wallet[];
  recentTransactions: Transaction[];
  recentLogs: SecurityLog[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}


export interface SecurityLog {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  event_type: string;
  status: 'success' | 'failed' | 'warning';
  ip_address?: string | null;
  geo_location?: {
    country?: string;
    city?: string;
    region?: string;
  } | null;
  device_type?: string | null;
  operating_system?: string | null;
  browser?: string | null;
  user_agent?: string | null;
  session_id?: string | null;
  auth_method?: string | null;
  risk_score: number;
  risk_indicators: string[];
  details?: Record<string, any>;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  event_type: string;
  related_user_id?: string | null;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface DepositAddress {
  id: string;
  asset: string;
  network: string;
  address: string;
  memo_tag?: string | null;
  is_active: boolean;
  created_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepositAddressHistory {
  id: string;
  deposit_address_id: string;
  asset: string;
  network: string;
  previous_address?: string | null;
  new_address: string;
  admin_id?: string | null;
  reason: string;
  created_at: string;
}

export interface SystemSetting {
  id?: string;
  key: string;
  value: string;
  network?: string;
  description?: string;
  updated_by?: string | null;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance?: number;
  locked_balance?: number;
  mining_balance?: number;
  profit_balance?: number;
  available_balance?: number;
  deposited_balance?: number;
  pending_rewards?: number;
  realized_rewards?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'mining_yield' | 'adjustment' | 'fee';
  asset: string;
  network: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'settled';
  address?: string | null;
  tx_hash?: string | null;
  memo?: string | null;
  admin_notes?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FinancialLedger {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'WITHDRAWAL_FEE' | 'ADJUSTMENT';
  amount: number;
  currency: string;
  reference_id?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export type DepositRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface DepositRequest {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  asset: string;
  network: string;
  amount: number;
  deposit_address: string;
  memo_tag?: string | null;
  transaction_hash: string;
  proof_reference?: string | null;
  status: DepositRequestStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';

export interface BankDetails {
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  swift_routing?: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  asset: string;
  network: string;
  destination_wallet_address: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: WithdrawalStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  local_currency?: string;
  conversion_rate?: number;
  converted_amount?: number;
  payout_method?: string;
  bank_details?: BankDetails;
  hbc_vbc_code?: string;
  gas_fee_paid?: boolean;
  gas_fee_status?: string;
  gas_fee_tx_hash?: string;
  tier_upgrade_status?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export type WithdrawalFeeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WithdrawalFeeRecord {
  id: string;
  withdrawal_id?: string | null;
  user_id: string;
  asset: string;
  fee_type: string;
  fee_amount: number;
  status: WithdrawalFeeStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export type MessageSenderType = 'USER' | 'ADMIN' | 'BOT';

export interface SupportConversation {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  status: 'OPEN' | 'PENDING_ADMIN' | 'RESOLVED' | 'CLOSED';
  subject?: string;
  last_message?: string;
  last_message_at: string;
  last_sender_type: MessageSenderType;
  unread_user_count: number;
  unread_admin_count: number;
  is_bot_active: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id?: string | null;
  sender_name: string;
  message: string;
  attachment_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export type ConversionStatus = 'PENDING' | 'CONVERTED' | 'REJECTED';

export interface ConversionRequest {
  id: string;
  user_id: string;
  user_email: string;
  usd_mine_amount: number;
  from_amount?: number;
  from_currency?: string;
  target_currency: string;
  converted_amount: number;
  to_amount?: number;
  exchange_rate: number;
  conversion_fee_usd: number;
  fee_amount_usd?: number;
  conversion_fee_bnb: number;
  fee_amount_bnb?: number;
  fee_wallet_address: string;
  status: ConversionStatus;
  ref_code: string;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  user_profile?: UserProfile;
}
