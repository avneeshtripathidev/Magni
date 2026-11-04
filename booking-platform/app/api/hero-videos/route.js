import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

let memoryCache = {
  data: null,
  cachedAt: 0,
};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (memoryCache.data && (now - memoryCache.cachedAt < CACHE_TTL_MS)) {
      return NextResponse.json(memoryCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'heroSec/HerSec Videos/',
    });

    const data = await s3Client.send(command);
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!data.Contents) {
      return NextResponse.json([]);
    }

    const videos = data.Contents
      .filter(item => item.Key.endsWith('.mp4'))
      .map(item => {
        const fileName = item.Key.split('/').pop();
        const title = fileName.replace('.mp4', '').replace(/ (Portrait|Landscape)$/i, '');
        const isPortrait = /portrait/i.test(fileName);
        
        return {
          id: item.ETag,
          title: title,
          url: `${publicUrl}/${item.Key}`,
          thumbnail: `${publicUrl}/assets/lux-hero-artist.webp`,
          orientation: isPortrait ? 'portrait' : 'landscape',
          lastModified: item.LastModified
        };
      });

    memoryCache = {
      data: videos,
      cachedAt: now,
    };

    return NextResponse.json(videos, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching R2 videos:', error);
    if (memoryCache.data) {
      return NextResponse.json(memoryCache.data);
    }
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
