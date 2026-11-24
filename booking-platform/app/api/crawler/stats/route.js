import { NextResponse } from 'next/server';
import { crawlerQueue } from '@/lib/crawler/crawlerQueue.js';
import { gscAdapter } from '@/lib/crawler/googleSearchConsoleAdapter.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = crawlerQueue.getDashboardStats();
    const gscSummary = await gscAdapter.getSiteIndexSummary();
    const gscAnalytics = await gscAdapter.getSearchAnalytics();

    return NextResponse.json({
      success: true,
      stats,
      gscSummary,
      gscAnalytics,
      recentLogs: crawlerQueue.crawlLogs.slice(0, 30),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
