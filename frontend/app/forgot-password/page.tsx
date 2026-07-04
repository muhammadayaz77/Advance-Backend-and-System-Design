"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
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
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import { NAVBAR_GREEN, NAVBAR_GREEN_LIGHT } from "@/lib/brand-colors";

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      await authApi.forgotPassword(values);
      toast.success("Reset link sent! Check your email.");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to send reset email. Please try again.";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <header
        className="relative z-20 px-6 py-4 shadow-sm"
        style={{
          background: `linear-gradient(to bottom, ${NAVBAR_GREEN} 0%, ${NAVBAR_GREEN_LIGHT} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#2E7D32]">
            Work Sphere
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-black font-bold hover:text-gray-800 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-black font-bold hover:text-gray-800 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/jobs"
              className="text-black font-bold hover:text-gray-800 transition-colors"
            >
              Find Jobs
            </Link>
          </nav>
          <Link href="/login">
            <Button
              variant="outline"
              className="bg-white text-black border-gray-200 hover:bg-gray-50 flex items-center gap-2 font-medium"
            >
              <img
                src="/file.svg"
                alt="Login"
                className="w-4 h-4 object-contain"
              />
              Login
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-4 bg-white">
        <div className="relative z-10 w-full max-w-5xl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            <div className="bg-[#D3EADC] p-8 md:p-12 flex flex-col items-center justify-center text-center md:w-1/2">
              <Image
                src="/IMG-20250430-WA0027 1.png"
                alt="Work Sphere Logo"
                width={140}
                height={140}
                className="mb-6"
                priority
              />
              <h2 className="text-2xl font-bold mb-4">Trouble logging in?</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Enter your email address below and we&apos;ll send you a secure
                link to reset your password.
              </p>
            </div>

            <div className="bg-white p-8 md:p-12 flex flex-col justify-center md:w-1/2">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Forgot Your Password?
              </h2>
              <p className="text-[6C7278] text-sm mb-6">
                Don&apos;t worry, it happens to the best of us. We&apos;ll get
                you back on track.
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700 block mb-2"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <FormControl>
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@gmail.com"
                              className="pr-12 h-12 bg-white border-gray-300 rounded-lg text-sm"
                              {...field}
                            />
                          </FormControl>
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 size-5 pointer-events-none" />
                        </div>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-lg"
                  >
                    {form.formState.isSubmitting
                      ? "Sending…"
                      : "Send Reset Link"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-[#2E7D32] hover:text-[#1B5E20] font-medium transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
