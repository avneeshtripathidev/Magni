import crypto from 'crypto';

const MAGIC_HEADER = Buffer.from('MAGNE_KYC_ENC_V1', 'ascii'); // 16 bytes

function getMasterKey(): Buffer {
  const secret =
    process.env.KYC_ENCRYPTION_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    'magnevents_admin_hmac_9f4b2e7c8a1d6f30e5c9a4b7d2e8f1c3a6b9d4e2f7a0c5b8';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a sensitive KYC buffer (Aadhaar, PAN, Passport, Address Proof) using AES-256-GCM.
 * The output contains a 16-byte magic header, 16-byte IV, 16-byte auth tag, and ciphertext.
 */
export function encryptKycBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([MAGIC_HEADER, iv, authTag, encrypted]);
}

/**
 * Decrypts a sensitive KYC buffer if it was encrypted.
 * Returns the original decrypted buffer. If not encrypted, returns original buffer safely.
 */
export function decryptKycBuffer(buffer: Buffer): Buffer {
  if (
    buffer.length < 48 ||
    buffer.subarray(0, 16).toString('ascii') !== 'MAGNE_KYC_ENC_V1'
  ) {
    // Not encrypted or legacy file
    return buffer;
  }

  const iv = buffer.subarray(16, 32);
  const authTag = buffer.subarray(32, 48);
  const ciphertext = buffer.subarray(48);

  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Determines whether a buffer is encrypted with Magnevents KYC encryption.
 */
export function isEncryptedKycBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 48 &&
    buffer.subarray(0, 16).toString('ascii') === 'MAGNE_KYC_ENC_V1'
  );
}

/**
 * Converts any raw public R2 KYC URL into a secure, admin-authenticated proxy URL.
 */
export function getSecureKycUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Already a secure admin gateway URL
  if (trimmed.startsWith('/api/admin/kyc-document') || trimmed.includes('/api/admin/kyc-document')) {
    return trimmed;
  }

  // If it's a private KYC file in R2
  if (trimmed.includes('artist-private-kyc')) {
    let key = trimmed;
    const match = trimmed.match(/artist-private-kyc\/.*$/);
    if (match) {
      key = match[0];
    }
    return `/api/admin/kyc-document?key=${encodeURIComponent(key)}`;
  }

  return trimmed;
}
