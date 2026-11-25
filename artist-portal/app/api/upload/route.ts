import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { encryptKycBuffer } from '@/lib/security/kycEncryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const PRIVATE_CATEGORIES = new Set([
  'private',
  'kyc',
  'aadhaar',
  'pan',
  'passport',
  'voter_id',
  'driving_license',
  'id_document',
  'id-document',
  'address_proof',
  'address-proof',
  'bank',
]);

function getS3Client() {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are not configured in artist-portal/.env.local');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function sanitizeSegment(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = String(formData.get('folder') || '').toLowerCase().trim();
    const rawCategory = String(formData.get('category') || 'media').toLowerCase().trim();
    const rawArtistId = String(formData.get('artistId') || 'general').trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 413 });
    }

    const bucket = process.env.R2_BUCKET_NAME || 'first';
    const publicUrl =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      'https://pub-0035a50eaf1046efa85b6e5d1631f721.r2.dev';

    const basicRoot = process.env.R2_BASIC_FOLDER || 'artist-basic-details';
    const privateRoot = process.env.R2_PRIVATE_FOLDER || 'artist-private-kyc';

    // Route strictly into one of the two Cloudflare R2 folders
    const isPrivate =
      requestedFolder === 'private' ||
      requestedFolder === privateRoot ||
      PRIVATE_CATEGORIES.has(rawCategory);

    const rootFolder = isPrivate ? privateRoot : basicRoot;
    const categorySegment = sanitizeSegment(rawCategory, isPrivate ? 'aadhaar' : 'media');
    const artistSegment = sanitizeSegment(rawArtistId, 'general');

    const rawExt = (file.name.split('.').pop() || 'bin').toLowerCase();
    const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'bin';

    const key = `${rootFolder}/${categorySegment}/${artistSegment}/${randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If private KYC document, encrypt buffer using AES-256-GCM before storing in Cloudflare R2
    const finalBuffer = isPrivate ? encryptKycBuffer(buffer) : buffer;

    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: finalBuffer,
        ContentType: isPrivate ? 'application/octet-stream' : (file.type || 'application/octet-stream'),
        Metadata: {
          folder_type: isPrivate ? 'private-kyc' : 'basic-details',
          category: categorySegment,
          artist_id: artistSegment.replace(/[^\x20-\x7E]/g, '') || 'general',
          encrypted: isPrivate ? 'true' : 'false',
        },
      })
    );

    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    // Private KYC documents route through the authenticated admin proxy; public media uses CDN
    const url = isPrivate
      ? `/api/admin/kyc-document?key=${encodeURIComponent(key)}`
      : `${baseUrl}/${key}`;

    return NextResponse.json(
      {
        url,
        key,
        bucket,
        folder: rootFolder,
        visibility: isPrivate ? 'private' : 'basic',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Cloudflare R2 upload failed' },
      { status: 500 }
    );
  }
}
