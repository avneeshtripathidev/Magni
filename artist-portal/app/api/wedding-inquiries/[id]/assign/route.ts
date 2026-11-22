import { NextRequest, NextResponse } from 'next/server';
import { weddingInquiryService } from '../../../../../services/weddingInquiryService';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { artistId, artistName } = await req.json();
    if (!artistId || !artistName) {
      return NextResponse.json({ success: false, error: 'artistId and artistName are required.' }, { status: 400 });
    }

    const res = await weddingInquiryService.assignArtist(params.id, artistId, artistName);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    const updated = await weddingInquiryService.getInquiryById(params.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
