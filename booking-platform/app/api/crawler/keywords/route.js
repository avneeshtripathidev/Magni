import { NextResponse } from 'next/server';
import { generateKeywordsForCity, analyzeBookingIntent, EVENT_CATEGORIES, ARTIST_ACTS } from '@/lib/seo/keywordEngine.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'delhi';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category');
    const analyzeQuery = searchParams.get('query');

    if (analyzeQuery) {
      const intentAnalysis = analyzeBookingIntent(analyzeQuery);
      return NextResponse.json({
        success: true,
        query: analyzeQuery,
        intentAnalysis
      });
    }

    const keywords = generateKeywordsForCity(city, { limit, category });

    return NextResponse.json({
      success: true,
      city,
      total: keywords.length,
      categories: EVENT_CATEGORIES.map(c => ({ id: c.id, name: c.name })),
      acts: ARTIST_ACTS.map(a => a.name),
      keywords
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
