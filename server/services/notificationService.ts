import { supabaseAdmin } from '../config/supabase';
import { AdminNotification } from '../types';

export class NotificationService {
  /**
   * Create an admin security notification
   */
  async createNotification(params: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
    event_type: string;
    related_user_id?: string | null;
    metadata?: Record<string, any>;
  }): Promise<AdminNotification | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          title: params.title,
          message: params.message,
          severity: params.severity || 'info',
          event_type: params.event_type,
          related_user_id: params.related_user_id || null,
          metadata: params.metadata || {},
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to insert admin notification:', error.message);
        return null;
      }

      return data;
    } catch (err: any) {
      console.warn('NotificationService error:', err.message);
      return null;
    }
  }

  /**
   * Get recent notifications
   */
  async getNotifications(limit = 50, unreadOnly = false): Promise<AdminNotification[]> {
    let query = supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }
  }
}

export const notificationService = new NotificationService();
