import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus in dev — too noisy
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
        // Treat data as fresh for 60 s before background re-fetch
        staleTime: 60 * 1000,
        // Only retry if the error is NOT a client error (4xx)
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
