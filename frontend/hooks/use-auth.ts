/**
 * Re-exports useAuth from the auth context so that components can import from
 * the conventional `hooks/` directory without being tied to the context path.
 */
export { useAuth } from "@/context/auth-provider";
export type { AuthUser } from "@/context/auth-provider";
