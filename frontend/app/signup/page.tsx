"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Eye, EyeOff, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";

const COUNTRY_OPTIONS = [
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      countryCode: "+92",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: RegisterInput) {
    try {
      await authApi.register(values);
      toast.success("Account created! Please check your email to verify.");
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.";
      toast.error(message);
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
      <div className="relative z-10 w-full max-w-[618px] px-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/IMG-20250430-WA0027 1.png"
            alt="Work Sphere Logo"
            width={140}
            height={140}
            className="mb-4"
            priority
          />
        </div>

        {/* Sign Up Form Card */}
        <Card className="bg-[#EEFAF3] backdrop-blur-sm shadow-lg rounded-2xl border-0 w-full max-w-[618px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Sign Up
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 flex-1 flex flex-col"
              >
                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Full Name<span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter Your Full Name"
                            className="pr-10 h-11 bg-white"
                            {...field}
                          />
                        </FormControl>
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email<span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter Your Email"
                            className="pr-10 h-11 bg-white"
                            {...field}
                          />
                        </FormControl>
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Set Password<span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (8 or more characters)"
                            className="pr-10 h-11 bg-white"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Phone Number
                  </p>
                  <div className="relative flex items-center h-11 bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden">
                    {/* Country Code Selector */}
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="m-0">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-auto h-full px-3 border-0 border-r border-gray-200 rounded-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 cursor-pointer">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg leading-none">
                                    {COUNTRY_OPTIONS.find(
                                      (c) => c.code === field.value,
                                    )?.flag ?? "🌐"}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                    <span className="text-gray-500">
                                      {country.code}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Phone Number Input */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="flex-1 m-0">
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter Your Phone Number"
                              className="flex-1 h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 pr-10"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Phone Icon */}
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 size-5 pointer-events-none" />
                  </div>
                </div>

                {/* Account Type Field — moved to onboarding after login */}

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-lg"
                >
                  {isSubmitting ? "Creating account…" : "Register"}
                </Button>

                {/* Login Link */}
                <div className="text-center pt-2">
                  <p className="text-sm font-medium text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
