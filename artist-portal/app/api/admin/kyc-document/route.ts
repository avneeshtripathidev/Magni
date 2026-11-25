import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  ADMIN_COOKIE_NAME,
  isServerAuthorizedAdminEmail,
  verifyAdminSessionToken,
} from '../../../../lib/auth/adminSessionServer';
import { decryptKycBuffer } from '../../../../lib/security/kycEncryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getS3Client() {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are not configured');
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

function getContentType(key: string): string {
  const ext = (key.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get('key') || searchParams.get('url') || '';

    if (!rawKey) {
      return NextResponse.json({ error: 'Missing document key or URL parameter.' }, { status: 400 });
    }

    // Extract R2 key from any raw URL or query parameter
    let key = rawKey.trim();
    if (key.includes('artist-private-kyc/')) {
      const match = key.match(/artist-private-kyc\/.*$/);
      if (match) key = match[0];
    } else if (key.includes('artist-basic-details/')) {
      const match = key.match(/artist-basic-details\/.*$/);
      if (match) key = match[0];
    }

    // Clean any query parameters attached to key
    key = key.split('?')[0];

    // =========================================================================
    // 1. STRICT ACCESS LOCK: Check Magnevents Super Admin Authentication
    // =========================================================================
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = verifyAdminSessionToken(adminToken);
    let isAuthorized = false;

    if (adminSession && (await isServerAuthorizedAdminEmail(adminSession.email))) {
      isAuthorized = true;
    }

    // Check optional bearer token or artist auth cookie fallback
    if (!isAuthorized) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && process.env.ADMIN_SESSION_SECRET && authHeader === `Bearer ${process.env.ADMIN_SESSION_SECRET}`) {
        isAuthorized = true;
      }
    }

    // If not authenticated as authorized admin, lock and reject immediately
    if (!isAuthorized) {
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>403 Forbidden - Magnevents KYC Security</title>
  <style>
    body { background: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #fff; }
    p { font-size: 13px; line-height: 1.5; color: #94a3b8; margin: 0 0 20px; }
    .btn { display: inline-block; background: #0ea5e9; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 10px; text-decoration: none; transition: background 0.2s; }
    .btn:hover { background: #0284c7; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Security Lock Active</div>
    <h1>Private Document Restricted</h1>
    <p>This government-issued KYC credential (Aadhaar / PAN) is strictly locked and confidential. It can only be opened from an authenticated Magnevents Artist Admin session.</p>
    <a href="/admin/login" class="btn">Sign in to Artist Admin</a>
  </div>
</body>
</html>`,
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, private',
          },
        }
      );
    }

    // =========================================================================
    // 2. Fetch encrypted object from Cloudflare R2
    // =========================================================================
    const bucket = process.env.R2_BUCKET_NAME || 'first';
    const s3 = getS3Client();

    let rawBuffer: Buffer;
    try {
      const getRes = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (!getRes.Body) {
        return NextResponse.json({ error: 'Object body is empty' }, { status: 404 });
      }

      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks: any[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      };

      rawBuffer = await streamToBuffer(getRes.Body);
    } catch (s3Err: any) {
      if (s3Err.name === 'NoSuchKey' || s3Err['$metadata']?.httpStatusCode === 404) {
        return NextResponse.json({ error: 'Private KYC document not found.' }, { status: 404 });
      }
      throw s3Err;
    }

    // =========================================================================
    // 3. Decrypt the buffer in memory
    // =========================================================================
    const decryptedBuffer = decryptKycBuffer(rawBuffer);
    const contentType = getContentType(key);

    return new Response(new Uint8Array(decryptedBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Content-Disposition': `inline; filename="kyc-document.${key.split('.').pop() || 'png'}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[AdminKYCDocument] Error serving private document:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve private document', details: err.message },
      { status: 500 }
    );
  }
}
