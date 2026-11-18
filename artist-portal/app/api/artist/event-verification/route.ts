import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  AssignedArtist,
  EventVerificationRecord,
  computeProofStatus,
} from '../../../../types/eventVerification';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'event-verifications.json');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_EVENTS: EventVerificationRecord[] = [
  {
    booking_id: 'MAG-8821',
    event_title: 'Wedding Sangeet Night',
    artist_name: 'Aarav Sharma',
    stage_name: 'Aarav & The Acoustic Project',
    client_name: 'Kapur Family',
    client_phone: '+91 98201 54321',
    client_email: 'kapur.family@gmail.com',
    city: 'Gurgaon, DLF Phase 5',
    venue: 'The Oberoi Courtyard',
    event_date: '2026-12-14',
    guest_count: 250,
    package_title: 'Acoustic Band (3-Piece)',
    budget: 55000,
    booking_status: 'confirmed',
    payout_status: 'Advance in Escrow',
    event_live_status: 'not_started',
    event_images: [],
    artist_location: null,
    updated_at: new Date().toISOString(),
  },
  {
    booking_id: 'MAG-8794',
    event_title: 'Corporate Gala Dinner',
    artist_name: 'Aarav Sharma',
    stage_name: 'Aarav & The Acoustic Project',
    client_name: 'Nexus Global Tech',
    client_phone: '+91 99100 23456',
    client_email: 'events@nexusglobal.in',
    city: 'Delhi Aerocity',
    venue: 'JW Marriott Grand Ballroom',
    event_date: '2026-12-22',
    guest_count: 120,
    package_title: 'Solo Vocals + Backing Tracks',
    budget: 35000,
    booking_status: 'pending',
    payout_status: 'Proposal Review',
    event_live_status: 'not_started',
    event_images: [],
    artist_location: null,
    updated_at: new Date().toISOString(),
  },
  {
    booking_id: 'MAG-8855',
    event_title: 'Destination Sangeet & Afterparty',
    artist_name: 'DJ Rohan K',
    stage_name: 'DJ Rohan (Club & Sangeet Specialist)',
    client_name: 'Pooja Agarwal',
    client_phone: '+91 98450 78901',
    client_email: 'pooja.weddings@outlook.com',
    city: 'Udaipur',
    venue: 'Taj Lake Palace Courtyard',
    event_date: '2026-12-18',
    guest_count: 300,
    package_title: 'DJ + Percussionist Full Night',
    budget: 75000,
    booking_status: 'confirmed',
    payout_status: 'Advance in Escrow',
    event_live_status: 'not_started',
    event_images: [],
    artist_location: null,
    updated_at: new Date().toISOString(),
  },
  {
    booking_id: 'MAG-8710',
    event_title: 'Private House Concert',
    artist_name: 'Aarav Sharma',
    stage_name: 'Aarav & The Acoustic Project',
    client_name: 'Mehra Residence',
    client_phone: '+91 98199 44332',
    client_email: 'mehra.events@gmail.com',
    city: 'South Delhi',
    venue: 'Vasant Vihar Lawn',
    event_date: '2026-12-02',
    guest_count: 40,
    package_title: 'Acoustic Duo Set',
    budget: 22000,
    booking_status: 'completed',
    payout_status: 'Settled to Bank',
    event_live_status: 'not_started',
    event_images: [],
    artist_location: null,
    updated_at: new Date().toISOString(),
  },
];

function normalizeEvent(r: EventVerificationRecord): EventVerificationRecord {
  const assigned: AssignedArtist[] =
    Array.isArray(r.assigned_artists) && r.assigned_artists.length > 0
      ? r.assigned_artists
      : (r.artist_name || 'Aarav Sharma')
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
          .map((name, idx) => ({
            artist_id: `artist-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
            name,
            stage_name: idx === 0 ? r.stage_name || name : name,
          }));

  return {
    ...r,
    assigned_artists: assigned,
    artist_name: assigned.map((a) => a.name).join(', '),
  };
}

function readStore(): EventVerificationRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const normalized = DEFAULT_EVENTS.map(normalizeEvent);
      fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
      return normalized;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EVENTS;
    return list.map(normalizeEvent);
  } catch (err) {
    console.warn('Could not read local event store, using defaults:', err);
    return DEFAULT_EVENTS.map(normalizeEvent);
  }
}

function writeStore(records: EventVerificationRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist local event store:', err);
  }
}

async function syncToSupabase(record: EventVerificationRecord) {
  if (!supabase) return;
  try {
    await supabase.from('event_verifications').upsert(
      {
        booking_id: record.booking_id,
        event_title: record.event_title,
        artist_name: record.artist_name,
        assigned_artists: record.assigned_artists || [],
        client_name: record.client_name,
        city: record.city,
        venue: record.venue,
        event_date: record.event_date,
        budget: record.budget,
        event_live_status: record.event_live_status,
        started_at: record.started_at || null,
        started_by: record.started_by || null,
        start_image_url: record.start_image_url || null,
        event_images: record.event_images || [],
        artist_location: record.artist_location || null,
        event_video_url: record.event_video_url || null,
        verified_at: record.verified_at || null,
        updated_at: record.updated_at,
      },
      { onConflict: 'booking_id' }
    );
  } catch {
    // Table may not be migrated yet in Supabase — local server store keeps full sync working
  }
}

// GET /api/artist/event-verification?booking_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id');

  const records = readStore();

  if (bookingId) {
    const found = records.find((r) => r.booking_id === bookingId);
    if (!found) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({
      event: found,
      proofStatus: computeProofStatus(found),
    });
  }

  return NextResponse.json({
    events: records.map((r) => ({
      ...r,
      proofStatus: computeProofStatus(r),
    })),
  });
}

// POST /api/artist/event-verification
// Admin triggers: { action: 'start_event' | 'create_and_start' | 'reset_event', ... }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, booking_id } = body;
    const records = readStore();
    const now = new Date().toISOString();

    if (action === 'start_event') {
      if (!booking_id) {
        return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
      }
      const idx = records.findIndex((r) => r.booking_id === booking_id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const updated: EventVerificationRecord = {
        ...records[idx],
        booking_status: 'confirmed',
        event_live_status: 'started',
        started_at: now,
        started_by: body.started_by || 'Artist Director Admin',
        updated_at: now,
      };

      records[idx] = updated;
      writeStore(records);
      await syncToSupabase(updated);

      return NextResponse.json({
        success: true,
        event: updated,
        proofStatus: computeProofStatus(updated),
      });
    }

    if (action === 'create_and_start') {
      const newId = `MAG-${Math.floor(1000 + Math.random() * 9000)}`;

      const incomingAssigned: AssignedArtist[] =
        Array.isArray(body.assigned_artists) && body.assigned_artists.length > 0
          ? body.assigned_artists.map((a: any, idx: number) => ({
              artist_id: a.artist_id || a.id || `artist-${idx + 1}`,
              name: a.name || 'Artist',
              stage_name: a.stage_name || a.name || 'Artist',
              category: a.category,
              city: a.city,
              profile_image_url: a.profile_image_url,
            }))
          : [
              {
                artist_id: 'artist-rev-001',
                name: body.artist_name || 'Aarav Sharma',
                stage_name: body.stage_name || body.artist_name || 'Aarav & The Acoustic Project',
              },
            ];

      const displayArtistNames = incomingAssigned.map((a) => a.name).join(', ');

      const newEvent: EventVerificationRecord = {
        booking_id: newId,
        event_title: body.event_title || 'Live Event Performance',
        artist_name: displayArtistNames,
        stage_name: incomingAssigned[0]?.stage_name || displayArtistNames,
        assigned_artists: incomingAssigned,
        client_name: body.client_name || 'VIP Client',
        client_phone: body.client_phone || '+91 98765 43210',
        city: body.city || 'Delhi NCR',
        venue: body.venue || 'Main Event Venue',
        event_date: body.event_date || now.slice(0, 10),
        guest_count: Number(body.guest_count) || 150,
        package_title:
          body.package_title ||
          (incomingAssigned.length > 1
            ? `Multi-Artist Lineup (${incomingAssigned.length} Performers)`
            : 'Live Event Set'),
        budget: Number(body.budget) || 40000,
        booking_status: 'confirmed',
        payout_status: 'Advance in Escrow',
        event_live_status: body.start_immediately === false ? 'not_started' : 'started',
        started_at: body.start_immediately === false ? undefined : now,
        started_by: body.start_immediately === false ? undefined : 'Artist Director Admin',
        event_images: [],
        artist_location: null,
        updated_at: now,
      };

      records.unshift(newEvent);
      writeStore(records);
      await syncToSupabase(newEvent);

      return NextResponse.json({
        success: true,
        event: newEvent,
        proofStatus: computeProofStatus(newEvent),
      });
    }

    if (action === 'assign_artists' && booking_id) {
      const idx = records.findIndex((r) => r.booking_id === booking_id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      const incomingAssigned: AssignedArtist[] = Array.isArray(body.assigned_artists)
        ? body.assigned_artists
        : [];
      if (incomingAssigned.length === 0) {
        return NextResponse.json({ error: 'Please assign at least one artist' }, { status: 400 });
      }

      const updated: EventVerificationRecord = {
        ...records[idx],
        assigned_artists: incomingAssigned,
        artist_name: incomingAssigned.map((a) => a.name).join(', '),
        stage_name: incomingAssigned[0]?.stage_name || incomingAssigned[0]?.name,
        updated_at: now,
      };
      records[idx] = updated;
      writeStore(records);
      await syncToSupabase(updated);

      return NextResponse.json({
        success: true,
        event: updated,
        proofStatus: computeProofStatus(updated),
      });
    }

    if (action === 'reset_event' && booking_id) {
      const idx = records.findIndex((r) => r.booking_id === booking_id);
      if (idx !== -1) {
        const updated: EventVerificationRecord = {
          ...records[idx],
          event_live_status: 'started',
          payout_status: 'Advance in Escrow',
          start_image_url: undefined,
          event_images: [],
          artist_location: null,
          event_video_url: undefined,
          verified_at: undefined,
          started_at: now,
          updated_at: now,
        };
        records[idx] = updated;
        writeStore(records);
        await syncToSupabase(updated);
        return NextResponse.json({
          success: true,
          event: updated,
          proofStatus: computeProofStatus(updated),
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process admin event action' },
      { status: 500 }
    );
  }
}

// PATCH /api/artist/event-verification
// Artist uploads proofs: start_image_url, event_images, artist_location, event_video_url
// Automatically verifies the event when ALL 4 items are uploaded!
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    const records = readStore();
    const idx = records.findIndex((r) => r.booking_id === booking_id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const current = records[idx];
    const now = new Date().toISOString();

    const updated: EventVerificationRecord = {
      ...current,
      start_image_url:
        body.start_image_url !== undefined ? body.start_image_url : current.start_image_url,
      event_images:
        Array.isArray(body.event_images) ? body.event_images : current.event_images,
      artist_location:
        body.artist_location !== undefined ? body.artist_location : current.artist_location,
      event_video_url:
        body.event_video_url !== undefined ? body.event_video_url : current.event_video_url,
      updated_at: now,
    };

    const proofStatus = computeProofStatus(updated);

    // Core Business Rule:
    // If the event was started by admin and ALL 4 mandatory items are uploaded
    // (Start Image + Event Images + Artist Live Location + Event Video),
    // the event is automatically marked VERIFIED!
    if (updated.event_live_status === 'started' && proofStatus.allUploaded) {
      updated.event_live_status = 'verified';
      updated.verified_at = now;
      updated.payout_status = 'Verified — Ready for Settlement';
    }

    records[idx] = updated;
    writeStore(records);
    await syncToSupabase(updated);

    return NextResponse.json({
      success: true,
      event: updated,
      proofStatus,
      justVerified: current.event_live_status !== 'verified' && updated.event_live_status === 'verified',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update event verification proofs' },
      { status: 500 }
    );
  }
}
