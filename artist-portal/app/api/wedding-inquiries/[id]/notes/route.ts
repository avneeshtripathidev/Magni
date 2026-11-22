import { NextRequest, NextResponse } from 'next/server';
import { weddingInquiryService } from '../../../../../services/weddingInquiryService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { note, role } = await req.json();
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note text is required.' }, { status: 400 });
    }

    const res = await weddingInquiryService.addNote(params.id, note, role || 'artist');
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    const updated = await weddingInquiryService.getInquiryById(params.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
