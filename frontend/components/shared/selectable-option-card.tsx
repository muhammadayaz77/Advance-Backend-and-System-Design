"use client";

import React from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NAVBAR_GREEN } from "@/lib/brand-colors";

interface SelectableOptionCardProps {
  title: React.ReactNode;
  icon: React.ReactNode;
  selected?: boolean;
  onSelect: () => void;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
}

export function SelectableOptionCard({
  title,
  icon,
  selected = false,
  onSelect,
  className,
  contentClassName,
  titleClassName,
}: SelectableOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full text-left focus:outline-none"
      aria-pressed={selected}
    >
      {selected && (
        <span
          className="absolute left-1/2 top-0 z-20 inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md"
          style={{ backgroundColor: NAVBAR_GREEN }}
          aria-hidden="true"
        >
          <Check className="h-5 w-5" />
        </span>
      )}

      <Card
        className={cn(
          "rounded-3xl border-2 shadow-md transition-all duration-200",
          "group-hover:-translate-y-0.5",
          selected
            ? "bg-[#EEFAF3]"
            : "border-transparent bg-[#EEFAF3] group-hover:border-[#68DF98]",
          className,
        )}
        style={selected ? { borderColor: NAVBAR_GREEN } : undefined}
      >
        <CardContent
          className={cn(
            "flex h-full flex-col items-center justify-center gap-6 p-8 text-center",
            contentClassName,
          )}
        >
          {icon}
          <div
            className={cn(
              "text-base font-medium text-gray-800 md:text-xl",
              titleClassName,
            )}
          >
            {title}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
