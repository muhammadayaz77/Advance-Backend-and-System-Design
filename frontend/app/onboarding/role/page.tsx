"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectableOptionCard } from "@/components/shared/selectable-option-card";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export default function SelectRolePage() {
  const router = useRouter();
  const { setTokenAndUser } = useAuth();
  const [selected, setSelected] = useState<"client" | "freelancer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleContinue() {
    if (!selected) return;

    setIsLoading(true);
    try {
      const { accessToken } = await authApi.completeOnboarding({
        accountType: selected,
        role: "other",
      });

      setTokenAndUser(accessToken);
      toast.success("Welcome!");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Abstrato com linhas brilhantes sutis _ Vetor Premium 1.png"
          alt="Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/IMG-20250430-WA0027 1.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-6"
            priority
          />
          <h1 className="text-3xl md:text-4xl font-bold text-black text-center">
            Join as a client or freelancer
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <SelectableOptionCard
            selected={selected === "client"}
            onSelect={() => setSelected("client")}
            icon={
              <div className="relative mb-2 h-[58px] w-[58px]">
                <Image
                  src="/file.svg"
                  alt="Client Icon"
                  fill
                  className="object-contain"
                />
              </div>
            }
            title={
              <>
                I&apos;m a client,
                <br />
                hiring for a project
              </>
            }
          />

          <SelectableOptionCard
            selected={selected === "freelancer"}
            onSelect={() => setSelected("freelancer")}
            icon={
              <div className="relative mb-2 h-[58px] w-[58px]">
                <Image
                  src="/file.svg"
                  alt="Freelancer Icon"
                  fill
                  className="object-contain"
                />
              </div>
            }
            title={
              <>
                I&apos;m a freelancer,
                <br />
                looking for work
              </>
            }
          />
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selected || isLoading}
          className="mt-10 h-12 min-w-44 rounded-xl px-8 text-base font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
