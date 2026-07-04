import {
  ApiError,
  apiRequest,
  apiUpload,
} from "@/lib/api-client";
import type {
  FreelancerProfile,
  UpdateFreelancerProfileBody,
} from "@/lib/types/freelancer-profile";

export async function getFreelancerProfile(): Promise<FreelancerProfile | null> {
  try {
    return await apiRequest<FreelancerProfile>("GET", "/freelancer/profile");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateFreelancerProfile(
  body: UpdateFreelancerProfileBody,
): Promise<FreelancerProfile> {
  return apiRequest<FreelancerProfile>("PATCH", "/freelancer/profile", body);
}

const AVATAR_FIELD = "file";

export async function uploadFreelancerAvatar(
  file: File,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append(AVATAR_FIELD, file);
  return apiUpload<{ avatarUrl: string }>("/freelancer/avatar", formData);
}
