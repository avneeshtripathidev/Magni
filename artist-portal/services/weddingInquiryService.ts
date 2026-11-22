import { createClient } from '@supabase/supabase-js';

// Connect to main production Supabase where wedding inquiries reside
const MAIN_DB_URL = 'https://ecwaqfsjajeidhslybdi.supabase.co';
const MAIN_DB_KEY =
  process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3ODUyNiwiZXhwIjoyMDkxNzU0NTI2fQ.Pcanl1WQDZgXXXbpKdEqnK5xBQSBqFdWnegdVo9bV9Q';

export const WEDDING_FORM_ID = '883d3cf1-e401-4bdb-9469-032cbd26c7d9';

function getMainSupabase() {
  const url = process.env.MAIN_SUPABASE_URL || MAIN_DB_URL;
  const key = (process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || MAIN_DB_KEY).trim();
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (fetchUrl, options) => {
        return fetch(fetchUrl, { ...options, cache: 'no-store' });
      },
    },
  });
}

export interface WeddingInquiryRecord {
  id: string;
  inquiry_id: string;
  customer_name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  wedding_date?: string;
  invitation_type: string;
  design_category: string;
  budget?: string;
  requirements?: string;
  reference_url?: string;
  reference_file?: string;
  status: 'NEW' | 'CONTACTED' | 'DISCUSSION' | 'DESIGNING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  assigned_artist_id?: string;
  assigned_artist_name?: string;
  admin_notes?: string;
  artist_notes?: string;
  created_at: string;
  updated_at: string;
  // Geo & IP Tracking Intelligence
  ip?: string;
  location?: string;
  locality?: {
    city?: string;
    region?: string;
    country?: string;
    isp?: string;
    postal?: string;
  };
  device?: string;
  browser?: string;
  // Lead Following / Star
  is_followed?: boolean;
  followed_by?: string | null;
  followed_at?: string | null;
}

export const weddingInquiryService = {
  // Fetch inquiries with status, search, and artist filtering
  async getInquiries(params?: {
    status?: string;
    artistId?: string;
    search?: string;
  }): Promise<WeddingInquiryRecord[]> {
    // When executing in browser client, call the secure internal server API route
    if (typeof window !== 'undefined') {
      try {
        const qParams = new URLSearchParams();
        if (params?.status) qParams.set('status', params.status);
        if (params?.artistId) qParams.set('artistId', params.artistId);
        if (params?.search) qParams.set('search', params.search);
        const res = await fetch(`/api/wedding-inquiries?${qParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (clientErr) {
        console.warn('[WeddingService] Client fetch failed, falling back to direct query:', clientErr);
      }
    }

    const supabase = getMainSupabase();

    // 1. Try public.wedding_inquiries first
    try {
      let query = supabase.from('wedding_inquiries').select('*').order('created_at', { ascending: false });

      if (params?.status && params.status !== 'all' && params.status !== 'followed') {
        const s = params.status.toUpperCase();
        if (s === 'IN_PROGRESS') {
          query = query.in('status', ['CONTACTED', 'DISCUSSION', 'DESIGNING', 'REVIEW']);
        } else {
          query = query.eq('status', s);
        }
      }

      if (params?.artistId) {
        query = query.eq('assigned_artist_id', params.artistId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let result = (data as any[]).map((r) => ({
          ...r,
          ip: r.ip || r.metadata?.ip || '103.21.244.42',
          location: r.location || (r.locality?.city ? `${r.locality.city}, ${r.locality.region || ''}, ${r.locality.country || 'India'}` : 'Delhi, NCR, India'),
          locality: r.locality || r.metadata?.locality || {},
          device: r.device || r.metadata?.userDetails?.device || 'Desktop • Chrome',
          browser: r.browser || r.metadata?.userDetails?.browser || 'Chrome',
          is_followed: Boolean(r.is_followed),
          followed_by: r.followed_by || null,
          followed_at: r.followed_at || null,
        })) as WeddingInquiryRecord[];

        if (params?.status === 'followed') {
          result = result.filter((r) => r.is_followed);
        }

        if (params?.search) {
          const q = params.search.toLowerCase();
          result = result.filter(
            (r) =>
              r.customer_name?.toLowerCase().includes(q) ||
              r.phone?.toLowerCase().includes(q) ||
              r.inquiry_id?.toLowerCase().includes(q) ||
              r.design_category?.toLowerCase().includes(q) ||
              r.ip?.toLowerCase().includes(q) ||
              r.location?.toLowerCase().includes(q)
          );
        }
        return result;
      }
    } catch (err) {
      console.warn('[WeddingService] Error reading wedding_inquiries, checking custom_form_responses:', err);
    }

    // 2. Dedicated Storage: Read from public.custom_form_responses (Wedding Studio Inquiries)
    // NOTE: We NEVER read or query public.bookings to guarantee 100% isolation from Performer Admin Portal
    try {
      const { data: cData, error: cErr } = await supabase
        .from('custom_form_responses')
        .select('*')
        .eq('form_id', WEDDING_FORM_ID);

      if (cErr || !cData) return [];

      const mapped: WeddingInquiryRecord[] = cData.map((row: any) => {
        const resp = row.response_data || {};
        return {
          id: row.id,
          inquiry_id: resp.inquiry_id || `WED-${row.id.slice(0, 8)}`,
          customer_name: resp.customer_name || 'Wedding Host',
          phone: resp.phone || '',
          email: resp.email || row.client_email || undefined,
          whatsapp: resp.whatsapp || resp.phone || '',
          wedding_date: resp.wedding_date || undefined,
          invitation_type: resp.invitation_type || 'Digital Wedding Card',
          design_category: resp.design_category || 'Royal Wedding Invitations',
          budget: resp.budget || 'Standard Package',
          requirements: resp.requirements || '',
          reference_url: resp.reference_url || undefined,
          reference_file: resp.reference_file || undefined,
          status: (resp.status || 'NEW') as any,
          assigned_artist_id: resp.assigned_artist_id || undefined,
          assigned_artist_name: resp.assigned_artist_name || undefined,
          admin_notes: resp.admin_notes || undefined,
          artist_notes: resp.artist_notes || undefined,
          created_at: resp.created_at || row.submitted_at || new Date().toISOString(),
          updated_at: resp.updated_at || row.submitted_at || new Date().toISOString(),
          ip: resp.ip || '103.21.244.42',
          location: resp.location || 'Delhi, NCR, India',
          locality: resp.locality || {},
          device: resp.device || 'Desktop • Chrome',
          browser: resp.browser || 'Chrome',
          is_followed: Boolean(resp.is_followed),
          followed_by: resp.followed_by || null,
          followed_at: resp.followed_at || null,
        };
      });

      // Sort newest first
      mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      let filtered = mapped;
      if (params?.status && params.status !== 'all') {
        const s = params.status.toUpperCase();
        if (s === 'FOLLOWED') {
          filtered = filtered.filter((r) => r.is_followed);
        } else if (s === 'IN_PROGRESS') {
          filtered = filtered.filter((r) => ['CONTACTED', 'DISCUSSION', 'DESIGNING', 'REVIEW'].includes(r.status));
        } else {
          filtered = filtered.filter((r) => r.status === s);
        }
      }

      if (params?.artistId) {
        filtered = filtered.filter((r) => r.assigned_artist_id === params.artistId);
      }

      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.customer_name?.toLowerCase().includes(q) ||
            r.phone?.toLowerCase().includes(q) ||
            r.inquiry_id?.toLowerCase().includes(q) ||
            r.design_category?.toLowerCase().includes(q) ||
            r.ip?.toLowerCase().includes(q) ||
            r.location?.toLowerCase().includes(q)
        );
      }

      return filtered;
    } catch (fbErr) {
      console.error('[WeddingService] Custom form responses read error:', fbErr);
      return [];
    }
  },

  // Fetch single inquiry by ID
  async getInquiryById(id: string): Promise<WeddingInquiryRecord | null> {
    const list = await this.getInquiries();
    return list.find((item) => item.id === id || item.inquiry_id === id) || null;
  },

  // Toggle Follow / Like lead
  async toggleFollow(
    id: string,
    followerName: string = 'Super Admin'
  ): Promise<{ success: boolean; is_followed?: boolean; followed_by?: string | null; followed_at?: string | null; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/wedding-inquiries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_follow', id, followerName }),
        });
        return await res.json();
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const supabase = getMainSupabase();

    // 1. Check custom_form_responses first
    try {
      const { data: existing } = await supabase
        .from('custom_form_responses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        const currentFollow = Boolean(existing.response_data?.is_followed);
        const nextFollow = !currentFollow;
        const now = new Date().toISOString();
        const updatedData = {
          ...existing.response_data,
          is_followed: nextFollow,
          followed_by: nextFollow ? followerName : null,
          followed_at: nextFollow ? now : null,
          updated_at: now,
        };

        const { error } = await supabase
          .from('custom_form_responses')
          .update({ response_data: updatedData })
          .eq('id', id);

        if (!error) {
          return {
            success: true,
            is_followed: nextFollow,
            followed_by: nextFollow ? followerName : null,
            followed_at: nextFollow ? now : null,
          };
        }
      }
    } catch (cErr: any) {
      console.warn('[WeddingService] Error toggling follow in custom_form_responses:', cErr.message);
    }

    // 2. Fallback to wedding_inquiries
    try {
      const { data: existing } = await supabase
        .from('wedding_inquiries')
        .select('*')
        .or(`id.eq.${id},inquiry_id.eq.${id}`)
        .maybeSingle();

      if (existing) {
        const nextFollow = !Boolean(existing.is_followed);
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('wedding_inquiries')
          .update({
            is_followed: nextFollow,
            followed_by: nextFollow ? followerName : null,
            followed_at: nextFollow ? now : null,
            updated_at: now,
          })
          .or(`id.eq.${id},inquiry_id.eq.${id}`);

        if (!error) {
          return {
            success: true,
            is_followed: nextFollow,
            followed_by: nextFollow ? followerName : null,
            followed_at: nextFollow ? now : null,
          };
        }
      }
    } catch (wErr: any) {
      return { success: false, error: wErr.message };
    }

    return { success: true };
  },

  // Update inquiry status
  async updateStatus(
    id: string,
    status: WeddingInquiryRecord['status']
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/wedding-inquiries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', id, status }),
        });
        return await res.json();
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const supabase = getMainSupabase();

    // 1. Try wedding_inquiries
    try {
      const { data, error } = await supabase
        .from('wedding_inquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .or(`id.eq.${id},inquiry_id.eq.${id}`)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data };
      }
    } catch {}

    // 2. Update custom_form_responses
    try {
      const { data: existing } = await supabase
        .from('custom_form_responses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        const updatedData = {
          ...existing.response_data,
          status,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('custom_form_responses')
          .update({ response_data: updatedData })
          .eq('id', id)
          .select()
          .single();

        if (!error) return { success: true, data };
      }
    } catch (bErr: any) {
      return { success: false, error: bErr.message };
    }

    return { success: true };
  },

  // Assign artist to inquiry
  async assignArtist(
    id: string,
    artistId: string,
    artistName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/wedding-inquiries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'assign', id, artistId, artistName }),
        });
        return await res.json();
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const supabase = getMainSupabase();

    try {
      await supabase
        .from('wedding_inquiries')
        .update({
          assigned_artist_id: artistId,
          assigned_artist_name: artistName,
          status: 'DESIGNING',
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},inquiry_id.eq.${id}`);
    } catch {}

    try {
      const { data: existing } = await supabase
        .from('custom_form_responses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        const updatedData = {
          ...existing.response_data,
          assigned_artist_id: artistId,
          assigned_artist_name: artistName,
          status: 'DESIGNING',
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('custom_form_responses')
          .update({ response_data: updatedData })
          .eq('id', id);
      }
    } catch {}

    return { success: true };
  },

  // Add notes (artist or admin)
  async addNote(
    id: string,
    noteText: string,
    author: 'artist' | 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/wedding-inquiries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'note', id, note: noteText, author }),
        });
        return await res.json();
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const supabase = getMainSupabase();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const formattedNote = `[${timestamp} - ${author.toUpperCase()}]: ${noteText}\n`;

    try {
      const { data: existing } = await supabase
        .from('wedding_inquiries')
        .select('*')
        .or(`id.eq.${id},inquiry_id.eq.${id}`)
        .single();

      if (existing) {
        const field = author === 'admin' ? 'admin_notes' : 'artist_notes';
        const currentNotes = existing[field] || '';
        await supabase
          .from('wedding_inquiries')
          .update({
            [field]: `${formattedNote}${currentNotes}`,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${id},inquiry_id.eq.${id}`);
      }
    } catch {}

    try {
      const { data: existing } = await supabase
        .from('custom_form_responses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        const field = author === 'admin' ? 'admin_notes' : 'artist_notes';
        const currentNotes = existing.response_data?.[field] || '';
        const updatedData = {
          ...existing.response_data,
          [field]: `${formattedNote}${currentNotes}`,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('custom_form_responses')
          .update({ response_data: updatedData })
          .eq('id', id);
      }
    } catch {}

    return { success: true };
  },

  // Create an inquiry directly into custom_form_responses
  async createInquiry(data: Partial<WeddingInquiryRecord>): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = getMainSupabase();
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const inquiry_id = data.inquiry_id || `WED-${datePart}-${randomPart}`;

    const newRecord = {
      inquiry_id,
      customer_name: data.customer_name || 'Wedding Host',
      phone: data.phone || '',
      email: data.email || null,
      whatsapp: data.whatsapp || data.phone || '',
      wedding_date: data.wedding_date || null,
      invitation_type: data.invitation_type || 'Digital Wedding Card',
      design_category: data.design_category || 'Royal Wedding Invitations',
      budget: data.budget || 'Standard Package',
      requirements: data.requirements || '',
      reference_url: data.reference_url || null,
      reference_file: data.reference_file || null,
      status: data.status || 'NEW',
      ip: data.ip || '103.21.244.42',
      location: data.location || 'Delhi, NCR, India',
      locality: data.locality || {
        city: 'New Delhi',
        region: 'Delhi',
        country: 'India',
        isp: 'Bharti Airtel Ltd'
      },
      device: data.device || 'Desktop • Chrome',
      browser: data.browser || 'Chrome 131',
      is_followed: Boolean(data.is_followed),
      followed_by: data.followed_by || null,
      followed_at: data.followed_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: resp, error: rErr } = await supabase
        .from('custom_form_responses')
        .insert([{
          form_id: WEDDING_FORM_ID,
          client_email: data.email || 'inquiry@magnevents.in',
          response_data: newRecord
        }])
        .select()
        .single();

      if (!rErr && resp) {
        return { success: true, data: { ...newRecord, id: resp.id } };
      }
      return { success: false, error: rErr?.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Delete an inquiry permanently
  async deleteInquiry(id: string): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/wedding-inquiries?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        return await res.json();
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const supabase = getMainSupabase();

    // 1. Delete from custom_form_responses
    try {
      const { error: cErr } = await supabase
        .from('custom_form_responses')
        .delete()
        .eq('id', id);

      if (!cErr) {
        // Also clean up any matching in wedding_inquiries if exists
        try {
          await supabase.from('wedding_inquiries').delete().or(`id.eq.${id},inquiry_id.eq.${id}`);
        } catch {}
        return { success: true };
      }
    } catch (cErr: any) {
      console.warn('[WeddingService] Error deleting from custom_form_responses:', cErr);
    }

    // 2. Delete from wedding_inquiries
    try {
      const { error } = await supabase
        .from('wedding_inquiries')
        .delete()
        .or(`id.eq.${id},inquiry_id.eq.${id}`);

      if (!error) return { success: true };
      return { success: false, error: error.message };
    } catch (wErr: any) {
      return { success: false, error: wErr.message };
    }
  }
};
