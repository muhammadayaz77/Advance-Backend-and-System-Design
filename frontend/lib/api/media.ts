import { apiUpload, apiRequest } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaType = "image" | "video";

export interface UploadMediaResult {
  url: string;
  publicId: string;
  resourceType: string;
  mediaType: MediaType;
  bytes: number;
  width?: number;
  height?: number;
  /** Duration in seconds — only present for videos */
  duration?: number;
}

// ─── Allowed types (mirrors backend) ─────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/mpeg",
] as const;

export const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;    //   5 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;  // 100 MB

// ─── Client-side pre-validation ───────────────────────────────────────────────

export interface ValidationError {
  file: File;
  reason: string;
}

export function validateMediaFile(file: File): string | null {
  const allowed = ALLOWED_MEDIA_TYPES as readonly string[];
  if (!allowed.includes(file.type)) {
    return `Unsupported type "${file.type}". Allowed: JPEG, PNG, GIF, WebP, MP4, MOV, WebM, AVI, MPEG.`;
  }
  const isVideo = file.type.startsWith("video/");
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${maxBytes / 1024 / 1024} MB for ${isVideo ? "videos" : "images"}.`;
  }
  if (file.size < 100) {
    return "File is empty or corrupted.";
  }
  return null;
}

// ─── Upload a single media file ───────────────────────────────────────────────

/**
 * Uploads a single photo or video to the backend → Cloudinary.
 * Throws ApiError on failure.
 */
export async function uploadMedia(file: File): Promise<UploadMediaResult> {
  const error = validateMediaFile(file);
  if (error) throw new Error(error);

  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<UploadMediaResult>("/freelancer/media", formData);
}

// ─── Upload multiple files concurrently ──────────────────────────────────────

export interface BatchUploadResult {
  succeeded: UploadMediaResult[];
  failed: ValidationError[];
}

/**
 * Uploads multiple media files.  
 * Files that fail client-side validation are collected in `failed` without
 * hitting the network.  Server-side failures are re-thrown.
 */
export async function uploadMediaBatch(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<BatchUploadResult> {
  const succeeded: UploadMediaResult[] = [];
  const failed: ValidationError[] = [];

  // Separate valid from invalid before touching the network
  const valid: File[] = [];
  for (const file of files) {
    const reason = validateMediaFile(file);
    if (reason) failed.push({ file, reason });
    else valid.push(file);
  }

  let completed = 0;
  const total = files.length;

  // Upload valid files in parallel (browser limits to ~6 concurrent anyway)
  await Promise.allSettled(
    valid.map(async (file) => {
      try {
        const result = await uploadMedia(file);
        succeeded.push(result);
      } catch (err) {
        failed.push({ file, reason: err instanceof Error ? err.message : "Upload failed" });
      } finally {
        completed++;
        onProgress?.(completed, total);
      }
    }),
  );

  return { succeeded, failed };
}

// ─── Delete a media asset ─────────────────────────────────────────────────────

/**
 * Deletes a previously uploaded media asset by its Cloudinary secure URL.
 */
export async function deleteMedia(url: string): Promise<void> {
  await apiRequest<void>("DELETE", "/freelancer/media", { url });
}
