import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "warning" | "danger" | "success";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold tracking-wide",
        {
          "bg-accent-light text-charcoal": variant === "default",
          "bg-amber-100 text-amber-900 border border-amber-300": variant === "warning",
          "bg-red-100 text-red-700": variant === "danger",
          "bg-emerald-100 text-emerald-800": variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}
