import { apiRequest, apiUpload } from "./api-client";

export type PerformerLanguageRow = {
  language: string;
  proficiency: string;
};

export type PaymentMethodDetails = {
  cardholderName: string | null;
  cardLast4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  cardBrand: string | null;
  saveCardInfo: boolean;
};

export type FreelancerProfileResponse = {
  userId: string;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  primaryTrade: string | null;
  otherSkills: string[];
  hourlyRate: number | null;
  eventRate: number | null;
  ratePricingMode: string | null;
  availabilityStatus: string;
  experienceYears: number | null;
  resumeUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  ageYears: number | null;
  country: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  timeZone: string | null;
  availabilityWorkdays: string[];
  availabilityPreferredHours: string[];
  paymentMethod: PaymentMethodDetails | null;
  performanceCategories: string[];
  performerLanguages: PerformerLanguageRow[];
  education: unknown[];
  portfolio: unknown[];
  experienceDetails: unknown;
};

export async function getFreelancerProfile(): Promise<FreelancerProfileResponse> {
  return apiRequest<FreelancerProfileResponse>("GET", "/freelancer/profile");
}

export async function patchFreelancerProfile(
  body: Record<string, unknown>,
): Promise<FreelancerProfileResponse> {
  return apiRequest<FreelancerProfileResponse>(
    "PATCH",
    "/freelancer/profile",
    body,
  );
}

export async function uploadFreelancerAvatar(
  file: File,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ avatarUrl: string }>("/freelancer/avatar", formData);
}
