"use client";

import React, {
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import {
  uploadMedia,
  deleteMedia,
  validateMediaFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type UploadMediaResult,
} from "@/lib/api/media";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  /** Local object-URL while uploading; Cloudinary URL after success */
  previewUrl: string;
  /** Cloudinary secure_url — undefined while still uploading */
  cloudUrl?: string;
  publicId?: string;
  mediaType: "image" | "video";
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
  /** Internal key for React lists */
  key: string;
}

export interface MediaUploaderProps {
  /** Called whenever the list of successfully uploaded items changes */
  onChange?: (items: MediaItem[]) => void;
  /** Maximum number of files that can be uploaded at once */
  maxFiles?: number;
  /** Allow images, videos, or both */
  accept?: "images" | "videos" | "both";
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function acceptAttr(accept: MediaUploaderProps["accept"]): string {
  if (accept === "images") return ALLOWED_IMAGE_TYPES.join(",");
  if (accept === "videos") return ALLOWED_VIDEO_TYPES.join(",");
  return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaUploader({
  onChange,
  maxFiles = 10,
  accept = "both",
  className = "",
}: MediaUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  /** Stable ref so processFiles doesn't capture a stale items value */
  const itemsRef = useRef<MediaItem[]>([]);
  itemsRef.current = items;

  const updateItem = useCallback(
    (key: string, patch: Partial<MediaItem>) => {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.key === key ? { ...it, ...patch } : it,
        );
        // notify parent only for items that are fully done
        onChange?.(next.filter((it) => it.status === "done"));
        return next;
      });
    },
    [onChange],
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Respect maxFiles
      const available = maxFiles - itemsRef.current.length;
      if (available <= 0) return;
      const toProcess = fileArray.slice(0, available);

      // Build initial item stubs (with local preview) and add them
      const newItems: MediaItem[] = toProcess.map((file) => ({
        key: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        previewUrl: URL.createObjectURL(file),
        mediaType: file.type.startsWith("video/") ? "video" : "image",
        status: "uploading",
        bytes: file.size,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Upload each file and update its stub
      await Promise.allSettled(
        toProcess.map(async (file, idx) => {
          const item = newItems[idx];
          const validationError = validateMediaFile(file);
          if (validationError) {
            updateItem(item.key, { status: "error", errorMessage: validationError });
            return;
          }

          try {
            const result: UploadMediaResult = await uploadMedia(file);
            updateItem(item.key, {
              status: "done",
              cloudUrl: result.url,
              previewUrl: result.url, // switch preview to CDN URL
              publicId: result.publicId,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration,
            });
          } catch (err) {
            updateItem(item.key, {
              status: "error",
              errorMessage: err instanceof Error ? err.message : "Upload failed",
            });
          }
        }),
      );
    },
    [maxFiles, updateItem],
  );

  // ── Drop handlers ────────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files);
        // Reset input so same file can be re-picked if needed
        e.target.value = "";
      }
    },
    [processFiles],
  );

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (item: MediaItem) => {
      // Immediately remove from UI
      setItems((prev) => {
        const next = prev.filter((it) => it.key !== item.key);
        onChange?.(next.filter((it) => it.status === "done"));
        return next;
      });
      // Revoke object URL to free memory
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      // Best-effort server deletion
      if (item.cloudUrl) {
        try {
          await deleteMedia(item.cloudUrl);
        } catch {
          /* silently ignore — asset will be cleaned up later */
        }
      }
    },
    [onChange],
  );

  // ─── Derived state ────────────────────────────────────────────────────────────
  const atCapacity = items.length >= maxFiles;
  const maxLabel =
    accept === "images"
      ? `Images up to ${MAX_IMAGE_BYTES / 1024 / 1024} MB`
      : accept === "videos"
        ? `Videos up to ${MAX_VIDEO_BYTES / 1024 / 1024} MB`
        : `Images up to 5 MB · Videos up to 100 MB`;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`mu-root ${className}`}>
      <style>{CSS}</style>

      {/* Drop zone */}
      {!atCapacity && (
        <div
          id={`mu-dropzone-${inputId}`}
          className={`mu-dropzone${isDragging ? " mu-dragging" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload media files"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <div className="mu-dz-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M20 16.5A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5V16"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="mu-dz-title">
            {isDragging ? "Drop to upload" : "Drag & drop or click to browse"}
          </p>
          <p className="mu-dz-hint">{maxLabel}</p>
          <p className="mu-dz-hint">
            {items.length}/{maxFiles} file{maxFiles !== 1 ? "s" : ""}
          </p>
          <input
            ref={inputRef}
            id={`mu-input-${inputId}`}
            type="file"
            multiple
            accept={acceptAttr(accept)}
            className="mu-input-hidden"
            onChange={onInputChange}
            aria-label="File input"
          />
        </div>
      )}

      {/* Gallery grid */}
      {items.length > 0 && (
        <ul className="mu-grid" role="list" aria-label="Uploaded media">
          {items.map((item) => (
            <li key={item.key} className={`mu-card mu-card--${item.status}`}>
              {/* Thumbnail */}
              <div className="mu-thumb">
                {item.mediaType === "video" ? (
                  <video
                    src={item.previewUrl}
                    className="mu-thumb-media"
                    muted
                    playsInline
                    preload="metadata"
                    aria-label="Video preview"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt="Uploaded image preview"
                    className="mu-thumb-media"
                  />
                )}

                {/* Overlay for uploading / error states */}
                {item.status === "uploading" && (
                  <div className="mu-overlay mu-overlay--uploading" aria-label="Uploading…">
                    <span className="mu-spinner" aria-hidden="true" />
                    <span className="mu-overlay-label">Uploading…</span>
                  </div>
                )}
                {item.status === "error" && (
                  <div className="mu-overlay mu-overlay--error" title={item.errorMessage}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="mu-overlay-icon">
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V8a1 1 0 0 1 1-1zm0 9a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 16z" />
                    </svg>
                    <span className="mu-overlay-label">Failed</span>
                  </div>
                )}

                {/* Video badge */}
                {item.mediaType === "video" && item.status === "done" && (
                  <span className="mu-badge mu-badge--video" aria-label="Video">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {item.duration != null ? formatDuration(item.duration) : "Video"}
                  </span>
                )}
              </div>

              {/* Meta */}
              {item.status === "done" && (
                <div className="mu-meta">
                  <span className="mu-meta-size">
                    {item.bytes != null ? formatBytes(item.bytes) : ""}
                    {item.width && item.height
                      ? ` · ${item.width}×${item.height}`
                      : ""}
                  </span>
                </div>
              )}
              {item.status === "error" && item.errorMessage && (
                <div className="mu-meta mu-meta--error" title={item.errorMessage}>
                  {item.errorMessage.length > 48
                    ? item.errorMessage.slice(0, 45) + "…"
                    : item.errorMessage}
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                className="mu-delete"
                onClick={() => handleDelete(item)}
                aria-label="Remove file"
                title="Remove"
                disabled={item.status === "uploading"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Scoped CSS (injected inline — no extra stylesheet needed) ─────────────────
const CSS = `
.mu-root {
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Drop zone */
.mu-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 24px;
  border: 2px dashed rgba(99,102,241,0.45);
  border-radius: 16px;
  background: rgba(99,102,241,0.04);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  user-select: none;
  outline: none;
}
.mu-dropzone:hover,
.mu-dropzone:focus-visible {
  border-color: rgba(99,102,241,0.75);
  background: rgba(99,102,241,0.08);
}
.mu-dropzone.mu-dragging {
  border-color: #6366f1;
  background: rgba(99,102,241,0.12);
  transform: scale(1.01);
}

.mu-dz-icon {
  width: 48px;
  height: 48px;
  color: #6366f1;
  opacity: 0.85;
}
.mu-dz-icon svg { width: 100%; height: 100%; }

.mu-dz-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}
.mu-dz-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.mu-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

/* Grid */
.mu-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

/* Card */
.mu-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #1e293b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.mu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
.mu-card--error {
  border: 1.5px solid #f87171;
}

/* Thumbnail */
.mu-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #0f172a;
}
.mu-thumb-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Overlays */
.mu-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  backdrop-filter: blur(2px);
}
.mu-overlay--uploading {
  background: rgba(15,23,42,0.65);
}
.mu-overlay--error {
  background: rgba(239,68,68,0.35);
  color: #fecaca;
}
.mu-overlay-label {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.02em;
}
.mu-overlay--error .mu-overlay-label {
  color: #fecaca;
}
.mu-overlay-icon {
  width: 28px;
  height: 28px;
  color: #f87171;
}

/* Spinner */
.mu-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: mu-spin 0.75s linear infinite;
}
@keyframes mu-spin {
  to { transform: rotate(360deg); }
}

/* Badge */
.mu-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  backdrop-filter: blur(6px);
}
.mu-badge--video {
  background: rgba(99,102,241,0.8);
  color: #fff;
}

/* Meta row */
.mu-meta {
  padding: 6px 8px;
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mu-meta--error {
  color: #f87171;
}

/* Delete button */
.mu-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(15,23,42,0.75);
  color: #f1f5f9;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.15s, transform 0.15s, background 0.15s;
  backdrop-filter: blur(4px);
}
.mu-card:hover .mu-delete,
.mu-card:focus-within .mu-delete {
  opacity: 1;
  transform: scale(1);
}
.mu-delete:hover {
  background: #ef4444;
}
.mu-delete svg {
  width: 14px;
  height: 14px;
}
.mu-delete:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
`;
