import { supabaseAdmin } from '../config/supabase';
import { SystemSetting } from '../types';

export class SystemSettingsService {
  /**
   * Get all system settings as key-value map
   */
  static async getAllSettings(): Promise<Record<string, { value: string; network?: string; description?: string }>> {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*');

    const defaultSettings: Record<string, { value: string; network?: string; description?: string }> = {
      gas_fee_address: {
        value: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y',
        network: 'TRC20',
        description: 'Platform Gas Fee Disbursement Vault (20% Withdrawal Fee)',
      },
      tier_upgrade_address: {
        value: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y',
        network: 'TRC20',
        description: 'Institutional Account Tier Upgrade Vault (Bronze, Gold, Premium)',
      },
      default_receive_limit: {
        value: '9000.00',
        network: '',
        description: 'Default user receiving and withdrawal threshold ($9,000)',
      },
    };

    if (error || !data || data.length === 0) {
      return defaultSettings;
    }

    const settingsMap = { ...defaultSettings };
    data.forEach((row: SystemSetting) => {
      settingsMap[row.key] = {
        value: row.value,
        network: row.network,
        description: row.description,
      };
    });

    return settingsMap;
  }

  /**
   * Get a specific setting value
   */
  static async getSetting(key: string, defaultValue: string = ''): Promise<{ value: string; network?: string }> {
    const settings = await this.getAllSettings();
    return settings[key] || { value: defaultValue };
  }

  /**
   * Update or insert a system setting
   */
  static async updateSetting(
    key: string,
    value: string,
    network?: string,
    description?: string,
    adminId?: string
  ): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .upsert(
        {
          key,
          value,
          network: network || 'TRC20',
          description,
          updated_by: adminId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.warn(`Fallback for updateSetting (${key}):`, error.message);
    }

    return data || { key, value, network, description };
  }
}
