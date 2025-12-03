import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  // AWS Credentials
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

  // S3 Bucket
  bucket: process.env.S3_BUCKET,
  prefix: process.env.S3_PREFIX || 'dev',

  // S3 Key Patterns
  keyPatterns: {
    document: (userId: string, documentId: string, ext: string) =>
      `${process.env.S3_PREFIX || 'dev'}/documents/${userId}/${documentId}.${ext}`,
    thumbnail: (userId: string, documentId: string) =>
      `${process.env.S3_PREFIX || 'dev'}/thumbnails/${userId}/${documentId}_thumb.jpg`,
  },

  // Signed URL Settings
  signedUrlExpiration: parseInt(process.env.S3_SIGNED_URL_EXPIRATION || '3600', 10), // 1 hour

  // Upload Settings
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024, // Convert to bytes
  allowedMimeTypes: [
    'image/png',
    'image/jpeg',
    'application/pdf',
  ],

  // Thumbnail Settings (for images)
  thumbnail: {
    width: 400,
    height: 300,
    fit: 'cover' as const,
    quality: 80,
  },
}));