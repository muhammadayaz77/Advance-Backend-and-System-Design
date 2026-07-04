import { apiRequest, apiUpload } from "@/lib/api-client";
import type {
  ArtistProfile,
  UpdateArtistProfileBody,
} from "@/lib/types/artist-profile";

// Fetch the artist's profile
export async function getArtistProfile(): Promise<ArtistProfile> {
  return apiRequest<ArtistProfile>("GET", "/client/artist/personal-details");
}

// Update the artist's profile (including payment method details)
export async function updateArtistProfile(
  body: UpdateArtistProfileBody,
): Promise<ArtistProfile> {
  return apiRequest<ArtistProfile>("PATCH", "/client/artist/personal-details", body);
}

// Upload avatar for artist
export async function uploadArtistAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ avatarUrl: string }>("/client/artist/avatar", formData);
}

// Save payment method for artist
export async function saveArtistPaymentMethod(body: any): Promise<{ message: string }> {
  // You can replace `any` with a proper DTO type later.
  return apiRequest<{ message: string }>("POST", "/client/artist/payment-method", body);
}
