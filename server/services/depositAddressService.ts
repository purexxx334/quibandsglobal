import { supabaseAdmin } from '../config/supabase';
import { DepositAddress, DepositAddressHistory } from '../types';

export class DepositAddressService {
  /**
   * Get all currently ACTIVE deposit addresses (for user deposit view & API)
   */
  async getActiveAddresses(): Promise<DepositAddress[]> {
    const { data, error } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .eq('is_active', true)
      .order('asset', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active deposit addresses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get active deposit address for a specific asset & network
   */
  async getActiveAddressForAsset(asset: string, network: string): Promise<DepositAddress | null> {
    const { data, error } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .eq('asset', asset.toUpperCase())
      .eq('network', network.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch address for ${asset}-${network}: ${error.message}`);
    }

    return data;
  }

  /**
   * Alias for getActiveAddressForAsset
   */
  async getActiveAddress(asset: string, network: string): Promise<DepositAddress | null> {
    return this.getActiveAddressForAsset(asset, network);
  }

  /**
   * Get all deposit addresses (Admin view)
   */
  async getAllAddresses(): Promise<DepositAddress[]> {
    const { data, error } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .order('asset', { ascending: true });

    if (error) {
      throw new Error(`Failed to list deposit addresses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add or replace a deposit address (Admin action with mandatory audit trail)
   */
  async setDepositAddress(params: {
    asset: string;
    network: string;
    address: string;
    memoTag?: string;
    notes?: string;
    adminId: string;
    reason: string;
    setAsActive?: boolean;
  }): Promise<DepositAddress> {
    const asset = params.asset.toUpperCase();
    const network = params.network.toUpperCase();
    const address = params.address.trim();

    // 1. Check existing active address for this asset/network
    const { data: previousActive } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .eq('asset', asset)
      .eq('network', network)
      .eq('is_active', true)
      .maybeSingle();

    // If making this address active, deactivate previous active addresses for this pair
    if (params.setAsActive !== false && previousActive) {
      await supabaseAdmin
        .from('deposit_addresses')
        .update({ is_active: false })
        .eq('id', previousActive.id);
    }

    // 2. Insert or update the target address
    const { data: newEntry, error: insertError } = await supabaseAdmin
      .from('deposit_addresses')
      .upsert(
        {
          asset,
          network,
          address,
          memo_tag: params.memoTag || null,
          notes: params.notes || null,
          is_active: params.setAsActive !== false,
          created_by: params.adminId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'asset, network, address' }
      )
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save deposit address: ${insertError.message}`);
    }

    // 3. Record in deposit_address_history audit log
    await supabaseAdmin.from('deposit_address_history').insert({
      deposit_address_id: newEntry.id,
      asset,
      network,
      previous_address: previousActive ? previousActive.address : null,
      new_address: address,
      admin_id: params.adminId,
      reason: params.reason || 'Admin updated deposit address',
    });

    // 4. Record in general audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.adminId,
      action: 'ADMIN_SET_DEPOSIT_ADDRESS',
      entity_type: 'deposit_addresses',
      entity_id: newEntry.id,
      details: {
        asset,
        network,
        previous_address: previousActive ? previousActive.address : null,
        new_address: address,
        reason: params.reason,
      },
    });

    return newEntry;
  }

  /**
   * Update an existing deposit address directly by ID (Admin action)
   */
  async updateAddressById(
    addressId: string,
    params: {
      asset?: string;
      network?: string;
      address?: string;
      memoTag?: string | null;
      notes?: string | null;
      isActive?: boolean;
      reason?: string;
    },
    adminId: string
  ): Promise<DepositAddress> {
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (fetchErr || !current) {
      throw new Error(`Deposit address ${addressId} not found.`);
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (params.asset) updates.asset = params.asset.toUpperCase();
    if (params.network) updates.network = params.network.toUpperCase();
    if (params.address) updates.address = params.address.trim();
    if (params.memoTag !== undefined) updates.memo_tag = params.memoTag;
    if (params.notes !== undefined) updates.notes = params.notes;
    if (params.isActive !== undefined) updates.is_active = params.isActive;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('deposit_addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to update deposit address: ${updateErr?.message}`);
    }

    // Record audit log
    await supabaseAdmin.from('deposit_address_history').insert({
      deposit_address_id: addressId,
      asset: updated.asset,
      network: updated.network,
      previous_address: current.address,
      new_address: updated.address,
      admin_id: adminId,
      reason: params.reason || 'Admin updated deposit address credentials',
    });

    return updated as DepositAddress;
  }


  /**
   * Toggle activation state of a deposit address
   */
  async toggleActive(
    addressId: string,
    isActive: boolean,
    adminId: string,
    reason: string
  ): Promise<DepositAddress> {
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('deposit_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (fetchError || !current) {
      throw new Error('Deposit address not found.');
    }

    // If activating, deactivate other active addresses for the same asset & network
    if (isActive) {
      await supabaseAdmin
        .from('deposit_addresses')
        .update({ is_active: false })
        .eq('asset', current.asset)
        .eq('network', current.network)
        .neq('id', addressId);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('deposit_addresses')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', addressId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to toggle address status: ${updateError.message}`);
    }

    // Record audit history
    await supabaseAdmin.from('deposit_address_history').insert({
      deposit_address_id: addressId,
      asset: current.asset,
      network: current.network,
      previous_address: current.address,
      new_address: current.address,
      admin_id: adminId,
      reason: `${isActive ? 'Activated' : 'Deactivated'} address: ${reason}`,
    });

    return updated;
  }

  /**
   * Get audit history for deposit addresses
   */
  async getAddressHistory(addressId?: string): Promise<DepositAddressHistory[]> {
    let query = supabaseAdmin
      .from('deposit_address_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (addressId) {
      query = query.eq('deposit_address_id', addressId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch address audit history: ${error.message}`);
    }

    return data || [];
  }
}

export const depositAddressService = new DepositAddressService();
