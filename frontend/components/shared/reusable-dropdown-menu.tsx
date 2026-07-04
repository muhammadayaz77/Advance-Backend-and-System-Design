"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  label: string;
  value: string;
}

interface ReusableDropdownMenuProps {
  options: DropdownOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function ReusableDropdownMenu({
  options,
  placeholder = "Select option",
  value,
  onChange,
  defaultOpen = false,
  className,
  triggerClassName,
  menuClassName,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
}: ReusableDropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [internalValue, setInternalValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedValue = value ?? internalValue;
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((option) => {
        const label = option.label.toLowerCase();
        const optionValue = option.value.toLowerCase();
        return (
          label.includes(normalizedSearch) ||
          optionValue.includes(normalizedSearch)
        );
      })
    : options;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setOpen(false);
    setSearchTerm("");
  }

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-gray-300 px-4 text-left text-base text-gray-500",
          triggerClassName,
        )}
      >
        <span className={cn(!selectedOption && "text-gray-400")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-100 mt-2 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg",
            menuClassName,
          )}
        >
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300"
                autoFocus
              />
            </div>
          )}
          {filteredOptions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              {emptyMessage}
            </div>
          )}
          {filteredOptions.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center justify-between px-6 py-4 text-left text-lg leading-none text-gray-700 transition-colors",
                  "hover:bg-gray-50 hover:text-gray-900",
                  isSelected && "bg-gray-100 font-medium text-gray-900",
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-6 w-6 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
