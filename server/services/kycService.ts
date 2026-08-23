import { supabaseAdmin } from '../config/supabase';
import { KycSubmission, KycStatus, KycDocumentType } from '../types';

export class KycService {
  /**
   * Get the current user's KYC submission status & records
   */
  async getUserKyc(userId: string): Promise<KycSubmission | null> {
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`[KycService] Error fetching user KYC:`, error.message);
      return null;
    }

    return data;
  }

  /**
   * Submit or re-submit KYC credentials
   */
  async submitKyc(
    userId: string,
    data: {
      documentType: KycDocumentType;
      documentNumber: string;
      firstName: string;
      lastName: string;
      dob: string;
      country: string;
      address: string;
      city?: string;
      postalCode?: string;
      idFrontUrl: string;
      idBackUrl?: string;
      selfieUrl: string;
    }
  ): Promise<KycSubmission> {
    // 1. Insert new KYC submission
    const { data: created, error } = await supabaseAdmin
      .from('kyc_submissions')
      .insert({
        user_id: userId,
        document_type: data.documentType,
        document_number: data.documentNumber.trim(),
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        dob: data.dob.trim(),
        country: data.country.trim(),
        address: data.address.trim(),
        city: data.city?.trim() || null,
        postal_code: data.postalCode?.trim() || null,
        id_front_url: data.idFrontUrl,
        id_back_url: data.idBackUrl || null,
        selfie_url: data.selfieUrl,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save KYC submission: ${error.message}`);
    }

    // 2. Update user's profile with PENDING KYC status and country/address
    await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: 'PENDING',
        country: data.country.trim(),
        address: data.address.trim(),
        city: data.city?.trim() || null,
        postal_code: data.postalCode?.trim() || null,
        dob: data.dob.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    // 3. Create Admin Notification
    try {
      await supabaseAdmin.from('admin_notifications').insert({
        title: 'New KYC Verification Submitted',
        message: `User submitted ${data.documentType} credentials for KYC verification.`,
        severity: 'info',
        event_type: 'kyc_submitted',
        related_user_id: userId,
        is_read: false,
      });
    } catch (nErr: any) {
      console.warn('Notification log error:', nErr.message);
    }

    return created;
  }

  /**
   * Get all KYC submissions for Admin Review
   */
  async getAllKycSubmissions(statusFilter?: string): Promise<KycSubmission[]> {
    let query = supabaseAdmin
      .from('kyc_submissions')
      .select(`
        *,
        user_profile:profiles!kyc_submissions_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback without foreign key join if needed
      const { data: rawData, error: rawError } = await supabaseAdmin
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawError) {
        throw new Error(`Failed to list KYC submissions: ${rawError.message}`);
      }

      // Populate user profile manually
      const userIds = [...new Set((rawData || []).map((k: any) => k.user_id))];
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('auth_user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.auth_user_id, p]));
      return (rawData || []).map((k: any) => ({
        ...k,
        user_profile: profileMap.get(k.user_id),
      }));
    }

    return data || [];
  }

  /**
   * Review KYC Submission (Approve / Reject)
   */
  async reviewKycSubmission(
    submissionId: string,
    adminId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<KycSubmission> {
    // 1. Fetch submission
    const { data: submission, error: fetchErr } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !submission) {
      throw new Error('KYC submission not found.');
    }

    // 2. Update submission status
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('kyc_submissions')
      .update({
        status,
        rejection_reason: status === 'REJECTED' ? rejectionReason?.trim() : null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update KYC submission: ${updateErr.message}`);
    }

    // 3. Update user profile kyc_status
    await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', submission.user_id);

    return updated;
  }
}

export const kycService = new KycService();
