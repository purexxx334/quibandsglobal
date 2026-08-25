import { supabaseAdmin } from '../config/supabase';
import { KycSubmission, KycStatus, KycDocumentType } from '../types';

export class KycService {
  /**
   * Get the current user's KYC submission status & records
   */
  async getUserKyc(userId: string): Promise<KycSubmission | null> {
    try {
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
    } catch (err: any) {
      console.warn(`[KycService] Exception fetching user KYC:`, err.message);
      return null;
    }
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
    try {
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
        .or(`auth_user_id.eq.${userId},id.eq.${userId}`);
    } catch (pErr: any) {
      console.warn('[KycService] Profile update warning:', pErr.message);
    }

    // 3. Create Admin Notification
    try {
      await supabaseAdmin.from('admin_notifications').insert({
        title: 'New KYC Verification Submitted',
        message: `${data.firstName} ${data.lastName} submitted ${data.documentType} credentials for KYC verification.`,
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
    try {
      let query = supabaseAdmin
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: submissions, error } = await query;
      if (error) {
        console.warn('[KycService] Error querying kyc_submissions:', error.message);
        throw new Error(`Failed to list KYC submissions: ${error.message}`);
      }

      if (!submissions || submissions.length === 0) {
        return [];
      }

      // Fetch associated user profiles
      const userIds = [...new Set(submissions.map((k: any) => k.user_id).filter(Boolean))];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profs } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .or(`auth_user_id.in.(${userIds.join(',')}),id.in.(${userIds.join(',')})`);
        profiles = profs || [];
      }

      const profileMap = new Map();
      for (const p of profiles) {
        if (p.auth_user_id) profileMap.set(p.auth_user_id, p);
        if (p.id) profileMap.set(p.id, p);
      }

      return submissions.map((k: any) => ({
        ...k,
        user_profile: profileMap.get(k.user_id) || null,
      }));
    } catch (err: any) {
      console.error('[KycService] getAllKycSubmissions error:', err.message);
      throw err;
    }
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
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          kyc_status: status,
          updated_at: new Date().toISOString(),
        })
        .or(`auth_user_id.eq.${submission.user_id},id.eq.${submission.user_id}`);
    } catch (pErr: any) {
      console.warn('[KycService] Profile update warning:', pErr.message);
    }

    // 4. Create user notification
    try {
      await supabaseAdmin.from('user_notifications').insert({
        user_id: submission.user_id,
        title: status === 'VERIFIED' ? 'KYC Verification Approved!' : 'KYC Verification Update',
        message: status === 'VERIFIED'
          ? 'Congratulations! Your identity credentials have been approved by compliance. Your account is now fully verified.'
          : `Your KYC verification submission was rejected. Reason: ${rejectionReason || 'Document details did not match or were unreadable.'}. Please re-submit clear documents.`,
        type: status === 'VERIFIED' ? 'success' : 'warning',
        is_read: false,
      });
    } catch (nErr: any) {
      console.warn('[KycService] User notification error:', nErr.message);
    }

    return updated;
  }
}

export const kycService = new KycService();
