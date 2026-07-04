"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getFreelancerProfile,
  updateFreelancerProfile,
} from "@/lib/api/freelancer-profile";
import type {
  FreelancerProfile,
  UpdateFreelancerProfileBody,
} from "@/lib/types/freelancer-profile";

export const freelancerProfileQueryKey = ["freelancer", "profile"] as const;

export function useFreelancerProfile(
  options?: Omit<
    UseQueryOptions<FreelancerProfile | null>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: freelancerProfileQueryKey,
    queryFn: getFreelancerProfile,
    ...options,
  });
}

export function useUpdateFreelancerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateFreelancerProfileBody) =>
      updateFreelancerProfile(body),
    onSuccess: (data) => {
      queryClient.setQueryData(freelancerProfileQueryKey, data);
    },
  });
}
