/**
 * Reusable React Query hooks built on top of apiRequest.
 *
 * GET  → useGet<TData>(path, options?)
 * POST → usePost<TData, TBody>(path, options?)
 * PUT  → usePut<TData, TBody>(path, options?)
 * PATCH→ usePatch<TData, TBody>(path, options?)
 * DEL  → useDelete<TData>(path, options?)
 *
 * All mutation hooks (POST/PUT/PATCH/DELETE) accept an optional `pathFn` to
 * build a dynamic URL from the variables — useful when the ID is in the path.
 *
 * Example usage:
 *
 *   // GET
 *   const { data, isLoading } = useGet<Job[]>("/jobs");
 *
 *   // POST
 *   const { mutate } = usePost<Job, CreateJobDto>("/jobs", {
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/jobs"] }),
 *   });
 *
 *   // PATCH with dynamic path
 *   const { mutate } = usePatch<Job, Partial<Job>>("/jobs", {
 *     pathFn: (vars) => `/jobs/${vars.id}`,
 *   });
 *   mutate({ id: "123", title: "Updated" });
 *
 *   // DELETE with dynamic path
 *   const { mutate } = useDelete<void>("/jobs", {
 *     pathFn: ({ id }: { id: string }) => `/jobs/${id}`,
 *   });
 *   mutate({ id: "123" });
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { apiRequest, type RequestOptions } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiRequestOptions = Omit<RequestOptions, "_isRetry">;

/** Extra options accepted by every mutation hook. */
interface MutationExtras<TVariables> {
  /** Build a dynamic URL from the mutation variables (e.g. `/jobs/${vars.id}`). */
  pathFn?: (variables: TVariables) => string;
  /** Pass-through options forwarded to apiRequest (e.g. { skipAuth: true }). */
  requestOptions?: ApiRequestOptions;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * Wraps useQuery for GET requests.
 * The `path` is automatically used as the query key.
 *
 * @param path     API endpoint (e.g. "/jobs")
 * @param options  All standard useQuery options + optional extra query keys and requestOptions
 */
export function useGet<TData = unknown>(
  path: string,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn"> & {
    /** Append extra segments to the query key (e.g. query params object). */
    queryKeyExtra?: unknown[];
    requestOptions?: ApiRequestOptions;
  },
) {
  const { queryKeyExtra, requestOptions, ...queryOptions } = options ?? {};

  const queryKey: QueryKey = queryKeyExtra ? [path, ...queryKeyExtra] : [path];

  return useQuery<TData>({
    queryKey,
    queryFn: () => apiRequest<TData>("GET", path, undefined, requestOptions),
    ...queryOptions,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * Wraps useMutation for POST requests.
 *
 * @param path     Default API endpoint; overridable per-call via `pathFn`
 * @param options  All standard useMutation options + pathFn / requestOptions
 */
export function usePost<TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, Error, TVariables> &
    MutationExtras<TVariables>,
) {
  const { pathFn, requestOptions, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const url = pathFn ? pathFn(variables) : path;
      return apiRequest<TData>("POST", url, variables, requestOptions);
    },
    ...mutationOptions,
  });
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

/**
 * Wraps useMutation for PUT requests (full replace).
 */
export function usePut<TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, Error, TVariables> &
    MutationExtras<TVariables>,
) {
  const { pathFn, requestOptions, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const url = pathFn ? pathFn(variables) : path;
      return apiRequest<TData>("PUT", url, variables, requestOptions);
    },
    ...mutationOptions,
  });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

/**
 * Wraps useMutation for PATCH requests (partial update).
 */
export function usePatch<TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, Error, TVariables> &
    MutationExtras<TVariables>,
) {
  const { pathFn, requestOptions, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const url = pathFn ? pathFn(variables) : path;
      return apiRequest<TData>("PATCH", url, variables, requestOptions);
    },
    ...mutationOptions,
  });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Wraps useMutation for DELETE requests.
 * Variables are used ONLY for building the path via `pathFn`; no body is sent.
 */
export function useDelete<TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, Error, TVariables> &
    MutationExtras<TVariables>,
) {
  const { pathFn, requestOptions, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const url = pathFn ? pathFn(variables) : path;
      return apiRequest<TData>("DELETE", url, undefined, requestOptions);
    },
    ...mutationOptions,
  });
}

// ─── Re-export useQueryClient for convenience ─────────────────────────────────
export { useQueryClient };
