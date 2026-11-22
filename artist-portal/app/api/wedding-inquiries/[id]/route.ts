import { NextRequest, NextResponse } from 'next/server';
import { weddingInquiryService } from '../../../../services/weddingInquiryService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const inquiry = await weddingInquiryService.getInquiryById(params.id);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: 'Wedding inquiry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: inquiry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.status) {
      await weddingInquiryService.updateStatus(params.id, body.status);
    }
    if (body.assigned_artist_id && body.assigned_artist_name) {
      await weddingInquiryService.assignArtist(params.id, body.assigned_artist_id, body.assigned_artist_name);
    }
    if (body.note) {
      await weddingInquiryService.addNote(params.id, body.note, body.role || 'artist');
    }

    const updated = await weddingInquiryService.getInquiryById(params.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
