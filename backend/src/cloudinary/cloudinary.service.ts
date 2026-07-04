import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import type { Env } from '../config/env.schema';

// ─── Size limits ────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   //  5 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_RAW_BYTES = 10 * 1024 * 1024;    // 10 MB

// ─── Allowed MIME sets ──────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',  // .mov
  'video/webm',
  'video/x-msvideo', // .avi
  'video/mpeg',
]);

export const ALLOWED_RAW_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const ALLOWED_MEDIA_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_VIDEO_MIMES,
]);

export type UploadFolder =
  | 'avatars'
  | 'resumes'
  | 'portfolio'
  | 'gigs'
  | 'job-attachments'
  | 'media';

export type MediaType = 'image' | 'video';

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // seconds — for video
}

// ─── Max concurrent uploads for batch helper ────────────────────────────────────
const BATCH_CONCURRENCY = 4;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly baseFolder = 'worksphere';

  constructor(private readonly config: ConfigService<Env>) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  // ─── Configuration check ──────────────────────────────────────────────────────

  isConfigured(): boolean {
    return !!(
      this.config.get<string>('CLOUDINARY_CLOUD_NAME') &&
      this.config.get<string>('CLOUDINARY_API_KEY') &&
      this.config.get<string>('CLOUDINARY_API_SECRET')
    );
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new BadRequestException('Cloudinary is not configured');
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────────

  /** Validates MIME type + size. Throws BadRequestException on failure. */
  validateFile(buffer: Buffer, mimeType: string): void {
    const isImage = ALLOWED_IMAGE_MIMES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_MIMES.has(mimeType);
    const isRaw = ALLOWED_RAW_MIMES.has(mimeType);

    if (!isImage && !isVideo && !isRaw) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }

    let maxBytes: number;
    if (isImage) maxBytes = MAX_IMAGE_BYTES;
    else if (isVideo) maxBytes = MAX_VIDEO_BYTES;
    else maxBytes = MAX_RAW_BYTES;

    if (buffer.length > maxBytes) {
      throw new BadRequestException(
        `File too large. Max ${maxBytes / 1024 / 1024} MB for ${mimeType}`,
      );
    }

    if (buffer.length < 100) {
      throw new BadRequestException('File is too small or empty');
    }
  }

  /** Returns the Cloudinary resource_type for a given MIME. */
  private resourceTypeFor(mimeType: string): 'image' | 'video' | 'auto' {
    if (ALLOWED_IMAGE_MIMES.has(mimeType)) return 'image';
    if (ALLOWED_VIDEO_MIMES.has(mimeType)) return 'video';
    return 'auto';
  }

  // ─── Core single upload ───────────────────────────────────────────────────────

  /**
   * Uploads a buffer to Cloudinary and returns the full UploadResult.
   * For large files (>5 MB) the buffer is streamed; Cloudinary handles
   * the rest on their side (no manual chunking needed via upload_stream).
   */
  async uploadFull(
    buffer: Buffer,
    mimeType: string,
    folder: UploadFolder,
    publicId?: string,
  ): Promise<UploadResult> {
    this.assertConfigured();
    this.validateFile(buffer, mimeType);

    const resourceType = this.resourceTypeFor(mimeType);
    const folderPath = `${this.baseFolder}/${folder}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: resourceType,
          // Optimise delivery: auto quality + format for images
          ...(resourceType === 'image' && {
            quality: 'auto',
            fetch_format: 'auto',
          }),
          // For video: eager transcoding to mp4 + webm for browser compatibility
          ...(resourceType === 'video' && {
            eager: [
              { format: 'mp4', quality: 'auto' },
              { format: 'webm', quality: 'auto' },
            ],
            eager_async: true,
          }),
          ...(publicId && { public_id: publicId }),
        },
        (err: Error | undefined, res: UploadApiResponse | undefined) => {
          if (err) {
            const e = err as Error & { http_code?: number };
            if (e.http_code === 403) {
              reject(
                new BadRequestException(
                  'Cloudinary upload denied (403). Verify API key upload permissions.',
                ),
              );
            } else if (e.http_code === 401) {
              reject(
                new BadRequestException(
                  'Cloudinary authentication failed (401). Check cloud name, API key and secret.',
                ),
              );
            } else {
              reject(new BadRequestException(e.message));
            }
            return;
          }
          if (res?.secure_url) resolve(res);
          else reject(new BadRequestException('Upload failed: no secure_url returned'));
        },
      );
      Readable.from(buffer).pipe(stream);
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: (result as UploadApiResponse & { duration?: number }).duration,
    };
  }

  /**
   * Backward-compatible wrapper — returns just the secure URL.
   * Existing callers (avatar, resume, portfolio) continue to work unchanged.
   */
  async upload(
    buffer: Buffer,
    mimeType: string,
    folder: UploadFolder,
    publicId?: string,
  ): Promise<string> {
    const result = await this.uploadFull(buffer, mimeType, folder, publicId);
    return result.secureUrl;
  }

  // ─── Batch / parallel upload ─────────────────────────────────────────────────

  /**
   * Uploads multiple files concurrently (max BATCH_CONCURRENCY at a time).
   * Returns results in the same order as the input array.
   * If any upload fails, the error is re-thrown after all in-flight uploads settle.
   */
  async uploadMany(
    files: Array<{ buffer: Buffer; mimeType: string; folder: UploadFolder; publicId?: string }>,
  ): Promise<UploadResult[]> {
    this.assertConfigured();

    const results: Array<UploadResult | Error> = new Array(files.length);
    let hasError = false;

    // Process in chunks of BATCH_CONCURRENCY
    for (let i = 0; i < files.length; i += BATCH_CONCURRENCY) {
      const chunk = files.slice(i, i + BATCH_CONCURRENCY);
      const settled = await Promise.allSettled(
        chunk.map((f) => this.uploadFull(f.buffer, f.mimeType, f.folder, f.publicId)),
      );
      settled.forEach((outcome, idx) => {
        if (outcome.status === 'fulfilled') {
          results[i + idx] = outcome.value;
        } else {
          results[i + idx] = outcome.reason as Error;
          hasError = true;
          this.logger.error(`Batch upload failed for index ${i + idx}`, outcome.reason);
        }
      });
    }

    if (hasError) {
      const firstError = results.find((r) => r instanceof Error) as Error;
      throw firstError;
    }

    return results as UploadResult[];
  }

  // ─── Media type helper ────────────────────────────────────────────────────────

  /** Returns 'image' | 'video' | null for a given MIME. */
  getMediaType(mimeType: string): MediaType | null {
    if (ALLOWED_IMAGE_MIMES.has(mimeType)) return 'image';
    if (ALLOWED_VIDEO_MIMES.has(mimeType)) return 'video';
    return null;
  }

  // ─── Public-ID extraction ─────────────────────────────────────────────────────

  /**
   * Parses the public_id from a Cloudinary delivery URL (image/raw/video).
   */
  extractPublicIdFromCloudinaryUrl(url: string): string | null {
    try {
      const u = new URL(url.trim());
      const m = u.pathname.match(
        /\/(?:image|raw|video)\/upload\/(?:v\d+\/)?([^?]+)/,
      );
      if (!m?.[1]) return null;
      let rest = m[1];
      rest = rest.replace(
        /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|mp4|mov|webm|avi|mpeg)$/i,
        '',
      );
      return rest || null;
    } catch {
      return null;
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  /**
   * Deletes an asset by secure URL. Tries image, raw, then video. Best-effort only.
   */
  async destroyBySecureUrl(url: string | null | undefined): Promise<void> {
    if (!url?.trim() || !this.isConfigured()) return;
    const trimmed = url.trim();
    if (!trimmed.includes('res.cloudinary.com')) return;

    const publicId = this.extractPublicIdFromCloudinaryUrl(trimmed);
    if (!publicId) return;

    const resourceTypes = ['image', 'raw', 'video'] as const;
    for (const resourceType of resourceTypes) {
      try {
        const result = (await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        })) as { result?: string };
        if (result?.result === 'ok') {
          this.logger.log(`Deleted Cloudinary asset: ${publicId} (${resourceType})`);
          return;
        }
      } catch {
        /* try next resource type */
      }
    }
  }

  /** Deletes many unique Cloudinary URLs concurrently (e.g. before removing a user row). */
  async destroyManyBySecureUrls(urls: Iterable<string>): Promise<void> {
    const seen = new Set<string>();
    const toDelete: string[] = [];
    for (const url of urls) {
      const t = url?.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      toDelete.push(t);
    }
    // Destroy concurrently, best-effort
    await Promise.allSettled(toDelete.map((u) => this.destroyBySecureUrl(u)));
  }
}
