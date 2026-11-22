import { NextRequest, NextResponse } from 'next/server';
import { weddingInquiryService } from '../../../services/weddingInquiryService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const artistId = searchParams.get('artistId') || undefined;

    const data = await weddingInquiryService.getInquiries({ status, search, artistId });
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, artistId, artistName, note, author } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Inquiry ID is required' }, { status: 400 });
    }

    if (action === 'status' && status) {
      const res = await weddingInquiryService.updateStatus(id, status);
      return NextResponse.json(res);
    }

    if (action === 'assign' && artistId) {
      const res = await weddingInquiryService.assignArtist(id, artistId, artistName || 'Assigned Designer');
      return NextResponse.json(res);
    }

    if (action === 'note' && note) {
      const res = await weddingInquiryService.addNote(id, note, author || 'admin');
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
