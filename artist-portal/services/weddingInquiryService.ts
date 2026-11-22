import { createClient } from '@supabase/supabase-js';

// Connect to main production Supabase where bookings and wedding inquiries reside
const MAIN_DB_URL = 'https://ecwaqfsjajeidhslybdi.supabase.co';
const MAIN_DB_KEY =
  process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3ODUyNiwiZXhwIjoyMDkxNzU0NTI2fQ.Pcanl1WQDZgXXXbpKdEqnK5xBQSBqFdWnegdVo9bV9Q';

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
        console.warn('[WeddingService] Client fetch failed, falling back to direct client query:', clientErr);
      }
    }

    const supabase = getMainSupabase();

    // 1. Try public.wedding_inquiries first
    try {
      let query = supabase.from('wedding_inquiries').select('*').order('created_at', { ascending: false });

      if (params?.status && params.status !== 'all') {
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
        let result = data as WeddingInquiryRecord[];
        if (params?.search) {
          const q = params.search.toLowerCase();
          result = result.filter(
            (r) =>
              r.customer_name?.toLowerCase().includes(q) ||
              r.phone?.toLowerCase().includes(q) ||
              r.inquiry_id?.toLowerCase().includes(q) ||
              r.design_category?.toLowerCase().includes(q)
          );
        }
        return result;
      }
    } catch (err) {
      console.warn('[WeddingService] Error reading wedding_inquiries, checking bookings fallback:', err);
    }

    // 2. Fallback: Read from bookings table
    try {
      const { data: bData, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .or('booking_source.eq.wedding_invitation_service,event_type.ilike.%Wedding Invitation%,source_form.eq.Wedding Invitation Studio')
        .order('created_at', { ascending: false });

      if (bErr || !bData) return [];

      const mapped: WeddingInquiryRecord[] = bData.map((b: any) => {
        let parsed: any = {};
        try {
          if (b.notes && b.notes.startsWith('{')) {
            parsed = JSON.parse(b.notes);
          }
        } catch (e) {}

        const statusMap: Record<string, any> = {
          pending: 'NEW',
          confirmed: 'COMPLETED',
          completed: 'COMPLETED',
          cancelled: 'CANCELLED',
          rejected: 'CANCELLED',
        };

        return {
          id: b.id,
          inquiry_id: parsed.inquiry_id || b.reference_code || `WED-${b.id.slice(0, 8)}`,
          customer_name: b.client_name || 'Wedding Host',
          phone: b.client_phone || '',
          email: b.client_email || undefined,
          whatsapp: parsed.whatsapp || b.client_phone || '',
          wedding_date: b.event_date || undefined,
          invitation_type: parsed.invitation_type || b.event_type || 'Digital Wedding Card',
          design_category: parsed.design_category || 'Royal Wedding Invitations',
          budget: parsed.budget || (b.budget ? `₹${b.budget}` : 'Standard Package'),
          requirements: parsed.requirements || b.notes || '',
          reference_url: parsed.reference_url || undefined,
          status: (parsed.status || statusMap[b.status] || 'NEW') as any,
          assigned_artist_id: b.artist_id || undefined,
          assigned_artist_name: b.custom_artist_name || undefined,
          admin_notes: parsed.admin_notes || undefined,
          artist_notes: parsed.artist_notes || undefined,
          created_at: b.created_at,
          updated_at: b.updated_at || b.created_at,
        };
      });

      let filtered = mapped;
      if (params?.status && params.status !== 'all') {
        const s = params.status.toUpperCase();
        if (s === 'IN_PROGRESS') {
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
            r.design_category?.toLowerCase().includes(q)
        );
      }

      return filtered;
    } catch (fbErr) {
      console.error('[WeddingService] Fallback read error:', fbErr);
      return [];
    }
  },

  // Fetch single inquiry by ID
  async getInquiryById(id: string): Promise<WeddingInquiryRecord | null> {
    const list = await this.getInquiries();
    return list.find((item) => item.id === id || item.inquiry_id === id) || null;
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

    // 2. Try bookings fallback
    try {
      const bookingStatus = status === 'COMPLETED' ? 'confirmed' : status === 'CANCELLED' ? 'cancelled' : 'pending';
      const { data: bRecord } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (bRecord) {
        let notesObj: any = {};
        try {
          if (bRecord.notes && bRecord.notes.startsWith('{')) {
            notesObj = JSON.parse(bRecord.notes);
          }
        } catch {}
        notesObj.status = status;

        const { data, error } = await supabase
          .from('bookings')
          .update({
            status: bookingStatus,
            notes: JSON.stringify(notesObj, null, 2),
            updated_at: new Date().toISOString(),
          })
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
      await supabase
        .from('bookings')
        .update({
          artist_id: artistId,
          custom_artist_name: artistName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
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

    return { success: true };
  },
};
