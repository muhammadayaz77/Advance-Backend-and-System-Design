"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim().toUpperCase() ?? "";
  const hasValidResetParams = useMemo(
    () => email.length > 0 && token.length === 6,
    [email, token],
  );

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    if (!hasValidResetParams) {
      toast.error("Invalid or expired reset link. Please request a new one.");
      return;
    }

    try {
      await authApi.resetPassword({
        email,
        token,
        newPassword: values.newPassword,
      });
      toast.success("Password reset successfully! Please log in.");
      router.push("/login?from=reset-password");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to reset password. Please try again.";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-[#e8f5e9] p-4 flex items-center justify-center">
      <div className="w-full max-w-[440px] rounded-2xl bg-white px-8 py-10 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-black">
          Reset Your Password
        </h1>
        <p className="mt-3 text-center text-sm text-gray-500">
          Enter your new password below and confirm it to secure your account.
        </p>

        {!hasValidResetParams ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-red-600 mb-4">
              This reset link is invalid or expired.
            </p>
            <Link
              href="/forgot-password"
              className="text-[#4CAF50] font-medium hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-5"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-black block mb-2"
                    >
                      New Password
                    </label>
                    <FormControl>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter your new password"
                        className="h-11 bg-white border-gray-300 rounded-md px-4 text-base placeholder:text-gray-400 focus-visible:ring-[#4CAF50] focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-black block mb-2"
                    >
                      Confirm New Password
                    </label>
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your new password"
                        className="h-11 bg-white border-gray-300 rounded-md px-4 text-base placeholder:text-gray-400 focus-visible:ring-[#4CAF50] focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              <p className="text-gray-500 text-sm">
                Password must be at least 8 characters long.
              </p>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full h-12 rounded-md bg-[#4CAF50] hover:bg-[#43a047] text-white font-medium"
              >
                {form.formState.isSubmitting
                  ? "Resetting..."
                  : "Reset Password"}
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-[#4CAF50] text-sm font-medium hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
