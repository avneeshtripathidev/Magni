import { NextResponse } from 'next/server';
import { crawlerQueue } from '@/lib/crawler/crawlerQueue.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    let records = [...crawlerQueue.discoveredRecords];

    if (status && status !== 'all') {
      records = records.filter(r => r.verificationStatus === status);
    }
    if (city && city !== 'All Locations') {
      records = records.filter(r => r.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (category && category !== 'All Acts') {
      records = records.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      const qLower = query.toLowerCase();
      records = records.filter(r => 
        r.name.toLowerCase().includes(qLower) || 
        r.city.toLowerCase().includes(qLower) ||
        r.notes?.toLowerCase().includes(qLower)
      );
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      records
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { recordId, status, reason } = body;

    if (!recordId || !status) {
      return NextResponse.json(
        { success: false, error: 'recordId and status are required' },
        { status: 400 }
      );
    }

    const result = crawlerQueue.updateRecordVerification(recordId, status, reason);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Record ${recordId} verification updated to ${status}`,
      record: result.record
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
