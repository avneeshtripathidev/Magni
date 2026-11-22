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
