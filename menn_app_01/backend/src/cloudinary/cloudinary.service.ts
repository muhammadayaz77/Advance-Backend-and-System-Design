import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Extracts publicId from a Cloudinary secure URL and deletes the asset.
 * Best-effort: silently catches any error and never throws.
 */
export async function destroyBySecureUrl(url: string): Promise<void> {
  if (!url || !env.CLOUDINARY_CLOUD_NAME) {
    return;
  }

  try {
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/public_id.jpg
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = url.match(regex);
    if (!match || !match[1]) {
      return;
    }

    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn("Cloudinary asset deletion failed (best effort):", error);
  }
}

export { cloudinary };

