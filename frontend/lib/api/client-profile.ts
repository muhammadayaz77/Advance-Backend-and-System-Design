import { apiRequest, apiUpload } from "@/lib/api-client";
import type {
  ClientCategoryRole,
  ClientJob,
  ClientProfile,
  CreateClientJobBody,
  UpdateClientJobBody,
  UpdateClientProfileBody,
} from "@/lib/types/client-profile";

export async function getClientProfile(): Promise<ClientProfile> {
  return apiRequest<ClientProfile>("GET", "/client/profile");
}

export async function updateClientProfile(
  body: UpdateClientProfileBody,
): Promise<ClientProfile> {
  return apiRequest<ClientProfile>("PATCH", "/client/profile", body);
}

export async function uploadClientAvatar(
  file: File,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ avatarUrl: string }>("/client/avatar", formData);
}

export async function getClientDraftJob(
  categoryRole: ClientCategoryRole = "education",
): Promise<ClientJob | null> {
  const job = await apiRequest<ClientJob | null>(
    "GET",
    `/client/jobs/draft?categoryRole=${categoryRole}`,
  );
  return job ?? null;
}

export async function createClientJob(
  body: CreateClientJobBody,
  categoryRole: ClientCategoryRole = "education",
): Promise<ClientJob> {
  return apiRequest<ClientJob>("POST", "/client/jobs", {
    ...body,
    categoryRole,
  });
}

export async function updateClientJob(
  jobId: string,
  body: UpdateClientJobBody,
): Promise<ClientJob> {
  return apiRequest<ClientJob>("PATCH", `/client/jobs/${jobId}`, body);
}

export async function uploadClientJobAttachment(
  file: File,
): Promise<{ attachmentUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ attachmentUrl: string }>(
    "/client/jobs/attachment",
    formData,
  );
}
