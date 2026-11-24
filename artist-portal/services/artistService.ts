import { supabase } from '../lib/supabase/client';
import { ArtistProfile, ArtistNotification } from '../types/artist';
import { calculateCompletion } from '../lib/utils';

export const artistService = {
  // Update entire profile or sections
  async updateProfile(artistId: string, updates: Partial<ArtistProfile>) {
    // Recalculate profile completion
    const newCompletion = calculateCompletion(updates);

    // Strip top-level fields that do not exist as columns on public.artists table
    const {
      is_onboarding_complete,
      onboarding_step,
      ...sanitized
    } = updates as any;

    const existingPerf = (sanitized.performance_details && typeof sanitized.performance_details === 'object') 
      ? sanitized.performance_details 
      : {};

    const perfDetails = {
      ...existingPerf,
      ...(is_onboarding_complete !== undefined ? { is_onboarding_complete } : {}),
      ...(onboarding_step !== undefined ? { onboarding_step } : {}),
    };

    const payload: Record<string, any> = {
      ...sanitized,
      profile_completion: newCompletion,
      updated_at: new Date().toISOString(),
    };

    if (Object.keys(perfDetails).length > 0) {
      payload.performance_details = perfDetails;
    }

    const { data, error } = await supabase
      .from('artists')
      .update(payload)
      .eq('id', artistId)
      .select()
      .single();

    if (error) throw error;
    return data as ArtistProfile;
  },

  // Submit profile for Admin Verification Review
  async submitForVerification(artistId: string) {
    const { data, error } = await supabase
      .from('artists')
      .update({
        verification_status: 'pending',
        rejection_reason: null, // Clear any previous rejection message
        profile_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId)
      .select()
      .single();

    if (error) throw error;

    // Log to verification history
    try {
      await supabase.from('artist_verification_history').insert([
        {
          artist_id: artistId,
          previous_status: 'pending',
          new_status: 'pending',
          reason: 'Artist submitted profile for initial admin verification review',
        },
      ]);
    } catch (e) {
      // Non-blocking
    }

    return data as ArtistProfile;
  },

  // Fetch in-app notifications
  async getNotifications(artistId: string): Promise<ArtistNotification[]> {
    try {
      const { data, error } = await supabase
        .from('artist_notifications')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Could not load notifications from Supabase:', err);
    }

    // LocalStorage fallback for offline / local testing
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`artist_notifs_${artistId}`);
        return local ? JSON.parse(local) : [];
      }
    } catch {}

    return [];
  },

  // Dispatch an in-app notification to an artist
  async sendNotification(
    notification: Omit<ArtistNotification, 'id' | 'created_at' | 'is_read'> & { is_read?: boolean }
  ): Promise<ArtistNotification> {
    const newNotif: ArtistNotification = {
      is_read: false,
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('artist_notifications').insert([newNotif]);
    } catch (e) {
      console.warn('Could not persist notification to Supabase:', e);
    }

    try {
      if (typeof window !== 'undefined') {
        const key = `artist_notifs_${notification.artist_id}`;
        const raw = localStorage.getItem(key);
        const existing: ArtistNotification[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(key, JSON.stringify([newNotif, ...existing]));
      }
    } catch {}

    return newNotif;
  },

  // Mark notification read
  async markNotificationRead(notificationId: string) {
    try {
      await supabase
        .from('artist_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch {}
  },

  // Fetch bookings assigned to or requested for this artist
  async getArtistBookings(artistId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not load bookings:', error);
      return [];
    }
    return data || [];
  },

  // Accept, reject, or update booking status (shared with web and app)
  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'rejected', notes?: string) {
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update artist availability / blocked calendar dates (shared with web and app)
  async updateAvailability(artistId: string, blockedDates: string[]) {
    const { data: currentArtist, error: fetchErr } = await supabase
      .from('artists')
      .select('performance_details')
      .eq('id', artistId)
      .single();

    if (fetchErr) throw fetchErr;

    const updatedDetails = {
      ...(currentArtist?.performance_details || {}),
      blocked_dates: blockedDates,
    };

    return this.updateProfile(artistId, { performance_details: updatedDetails });
  },

  // Real-time synchronization subscription for multi-platform sync (Web & Mobile App)
  subscribeToArtistChanges(artistId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`sync-artist-${artistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `artist_id=eq.${artistId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artists', filter: `id=eq.${artistId}` },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artist_notifications', filter: `artist_id=eq.${artistId}` },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Upload image to Supabase Storage
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  },
};
