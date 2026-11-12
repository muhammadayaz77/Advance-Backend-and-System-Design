import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-text)] disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "btn btn-primary",
          variant === "outline" && "btn btn-outline",
          variant === "secondary" && "btn btn-secondary",
          size === "default" && "h-[var(--btn-height)] px-4 py-2",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-11 px-8",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

