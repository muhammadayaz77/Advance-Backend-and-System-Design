"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: VerifyEmailInput) {
    try {
      await authApi.verifyEmail({ email, code: values.code });
      toast.success("Email verified! You can now log in.");
      router.push("/login");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Verification failed. Please try again.";
      toast.error(message);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    try {
      await authApi.resendVerification({ email });
      toast.success("Verification code resent! Check your email.");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to resend code. Please try again.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
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
      <div className="relative z-10 w-full max-w-120 px-4">
        {/* Logo */}
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

        <Card className="bg-white shadow-xl rounded-2xl border-0 w-full">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl font-bold text-black">
              Verify Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-5">
            <p className="text-sm text-gray-600 text-center">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-gray-800">
                {email || "your email"}
              </span>
              . Enter it below to activate your account.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="h-12 bg-white border-gray-300 rounded-lg text-sm tracking-widest text-center"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full h-12 bg-[#6CAF4F] hover:bg-[#5a9f3f] text-white font-bold rounded-lg text-sm"
                >
                  {form.formState.isSubmitting ? "Verifying…" : "Verify Email"}
                </Button>
              </form>
            </Form>

            <div className="text-center space-y-2 pt-2">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {isResending ? "Sending…" : "Resend"}
                </button>
              </p>
              <p className="text-sm text-gray-500">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
