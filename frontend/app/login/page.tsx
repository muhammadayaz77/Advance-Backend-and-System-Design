"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const GOOGLE_AUTH_URL = `${API_BASE}/auth/google`;

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const { setTokenAndUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginInput) {
    try {
      const { accessToken } = await authApi.login(values);
      setTokenAndUser(accessToken);

      // Decode to check onboarding status without an extra API call
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );

      if (!payload.onboardingCompleted) {
        router.push("/onboarding/role");
      } else {
        const next = safeNextPath(
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("next")
            : null,
        );
        router.push(next ?? "/dashboard");
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Login failed. Please try again.";
      toast.error(message);
    }
  }

  function handleGoogleLogin() {
    window.location.href = GOOGLE_AUTH_URL;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Abstrato com linhas brilhantes sutis _ Vetor Premium 1.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[618px] px-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/IMG-20250430-WA0027 1.png"
            alt="Work Sphere Logo"
            width={120}
            height={120}
            className="mb-4 drop-shadow-lg"
            priority
          />
        </div>

        {/* Login Form Card */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 w-full">
          <CardContent className="p-8 space-y-5">
            {/* Login Title */}
            <h2 className="text-2xl font-bold text-black text-center">Login</h2>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Email Input Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="user@gmail.com"
                            className="pr-12 h-12 bg-white border-gray-300 rounded-lg text-sm"
                            {...field}
                          />
                        </FormControl>
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Input Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className={`pr-12 h-12 bg-white rounded-lg text-sm ${
                              form.formState.errors.password
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-gray-300"
                            }`}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="size-5" />
                          ) : (
                            <Eye className="size-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-start justify-between mt-2">
                        <FormMessage className="text-red-500" />
                        {!form.formState.errors.password && (
                          <div className="flex-1" />
                        )}
                        <Link
                          href="/forgot-password"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                        >
                          Forgot Password ?
                        </Link>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#6CAF4F] hover:bg-[#5a9f3f] text-white font-bold rounded-lg text-sm"
                >
                  {isSubmitting ? "Logging in…" : "Login"}
                </Button>
              </form>
            </Form>

            {/* Or Separator */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative bg-white px-4">
                <span className="text-sm text-gray-500 font-medium">Or</span>
              </div>
            </div>

            {/* Continue with Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Sign Up Link */}
            <div className="text-center pt-2">
              <p className="text-sm font-medium text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
