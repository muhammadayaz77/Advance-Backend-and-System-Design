/** Mirrors `FreelancerProfileResponse` from the Nest `freelancer` module. */

export type PaymentMethodDetails = {
  cardholderName: string | null;
  cardLast4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  cardBrand: string | null;
  saveCardInfo: boolean;
};

export type EducationItem = {
  degreeName?: string;
  instituteName?: string;
  yearOfCompletion?: string;
  certificationName?: string;
  issuedBy?: string;
  issuedDate?: string;
};

export type PortfolioItem = {
  projectName?: string;
  industry?: string;
  duration?: string;
  cost?: string;
  description?: string;
  attachmentUrl?: string;
};

export type ExperienceAttachment = {
  fileName?: string;
  mimeType?: string;
  attachmentUrl?: string;
};

export type ExperienceDetails = {
  previousJobs: string | null;
  previousWorkImages: ExperienceAttachment[];
  certifications: ExperienceAttachment[];
};

export type FreelancerProfile = {
  userId: string;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  primaryTrade: string | null;
  otherSkills: string[];
  hourlyRate: number | null;
  availabilityStatus: string;
  experienceYears: number | null;
  resumeUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  timeZone: string | null;
  availabilityWorkdays: string[];
  availabilityPreferredHours: string[];
  paymentMethod: PaymentMethodDetails | null;
  education: EducationItem[];
  portfolio: PortfolioItem[];
  experienceDetails: ExperienceDetails;
  media: MediaItem[];
};

export type MediaItem = {
  url: string;
  publicId?: string;
  mediaType: 'image' | 'video';
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
};

/** Partial body for `PATCH /freelancer/profile` — keep in sync with `UpdateFreelancerProfileDto`. */
export type UpdateFreelancerProfileBody = Record<string, unknown>;
