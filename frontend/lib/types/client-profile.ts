export type ClientPaymentMethod = {
  cardholderName: string | null;
  cardLast4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  cardBrand: string | null;
  saveCardInfo: boolean;
};

export type ClientProfile = {
  fullName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  country: string | null;
  paymentMethod: ClientPaymentMethod | null;
  age: number | null;
  eventType: string | null;
  attachmentUrl: string | null;
};

export type UpdateClientProfileBody = {
  fullName?: string;
  companyName?: string;
  bio?: string;
  phone?: string;
  country?: string;
  age?: number;
  eventType?: string;
  paymentMethod?: {
    cardholderName?: string;
    cardLast4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cardBrand?: string;
    saveCardInfo?: boolean;
  };
  attachmentUrl?: string;
};

export type ClientJob = {
  id: string;
  title: string;
  description: string;
  categoryRole: string;
  status: string;
  attachmentUrl: string | null;
  category: string | null;
  subcategory: string | null;
  skills: string[];
  projectDuration: string | null;
  experienceLevel: string | null;
  budgetType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  serviceLocation: string | null;
  timelineNotes: string | null;
  jobStartDate: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
};

export type ClientCategoryRole = "education" | "blue_collar" | "student";

export type CreateClientJobBody = {
  title: string;
  description: string;
  attachmentUrl?: string | null;
  category?: string;
  subcategory?: string;
  skills?: string[];
  projectDuration?: string;
  experienceLevel?: string;
  status?: "draft" | "open";
};

export type UpdateClientJobBody = {
  title?: string;
  description?: string;
  attachmentUrl?: string | null;
  category?: string | null;
  subcategory?: string | null;
  skills?: string[];
  projectDuration?: string | null;
  experienceLevel?: string | null;
  budgetType?: "hourly" | "fixed" | "daily";
  budgetMin?: number | null;
  budgetMax?: number | null;
  serviceLocation?: string | null;
  timelineNotes?: string | null;
  jobStartDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: "draft" | "open";
};
