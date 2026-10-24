import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isS3Configured = Boolean(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
);

const s3Client = isS3Configured
  ? new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: Boolean(process.env.S3_ENDPOINT), // true for MinIO/R2
    })
  : null;

const S3_BUCKET = process.env.S3_BUCKET || 'smart-file-organizer';

// Local storage fallback directory
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads');
if (!isS3Configured && !fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

export interface StorageUploadResult {
  storageKey: string;
  url?: string;
}

/**
 * Store file buffer in object storage or local fallback storage.
 */
export async function storeFile(
  storageKey: string,
  buffer: Buffer,
  contentType: string
): Promise<StorageUploadResult> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return { storageKey };
  } else {
    // Local storage
    const targetPath = path.join(LOCAL_STORAGE_DIR, storageKey);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.writeFile(targetPath, buffer);
    return { storageKey };
  }
}

/**
 * Retrieve file as a Buffer and mimeType.
 */
export async function getFile(storageKey: string): Promise<{ buffer: Buffer; contentType?: string }> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
    });
    const response = await s3Client.send(command);
    const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('data', (chunk: Buffer) => chunks.push(chunk));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('error', reject);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('end', () => resolve(Buffer.concat(chunks)));
      });
    };
    const buffer = await streamToBuffer(response.Body);
    return { buffer, contentType: response.ContentType };
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in storage');
    }
    const buffer = await fs.promises.readFile(filePath);
    return { buffer };
  }
}

/**
 * Generate a pre-signed URL for direct upload or download if using S3.
 */
export async function generatePresignedDownloadUrl(
  storageKey: string,
  originalFilename: string,
  expiresInSeconds = 300
): Promise<string | null> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }
  return null;
}

/**
 * Delete a file from storage.
 */
export async function deleteStorageFile(storageKey: string): Promise<void> {
  if (isS3Configured && s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: storageKey,
      });
      await s3Client.send(command);
    } catch (err) {
      console.error('Failed to delete S3 object', err);
    }
  } else {
    try {
      const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error('Failed to delete local file', err);
    }
  }
}

export { isS3Configured };
