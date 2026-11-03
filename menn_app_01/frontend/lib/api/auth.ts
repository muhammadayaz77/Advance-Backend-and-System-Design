import { api } from "../api-client";

export interface AuthTokenResponse {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

export const authApi = {
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    countryCode?: string;
  }) => api.post<MessageResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokenResponse>("/auth/login", data),

  verifyEmail: (data: { email: string; code: string }) =>
    api.post<MessageResponse>("/auth/verify-email", data),

  resendVerification: (data: { email: string }) =>
    api.post<MessageResponse>("/auth/resend-verification", data),

  forgotPassword: (data: { email: string }) =>
    api.post<MessageResponse>("/auth/forgot-password", data),

  resetPassword: (data: {
    email: string;
    token: string;
    newPassword: string;
  }) => api.post<MessageResponse>("/auth/reset-password", data),

  refresh: () => api.post<AuthTokenResponse>("/auth/refresh"),

  logout: () => api.post<MessageResponse>("/auth/logout"),

  completeOnboarding: (data: {
    accountType: "freelancer" | "client";
    role: "individual" | "agency";
  }) => api.patch<AuthTokenResponse>("/auth/onboarding", data),

  deleteAccount: () => api.delete<MessageResponse>("/auth/account"),
};
