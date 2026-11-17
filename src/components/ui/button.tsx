import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Komponen Tombol Desain iOS Pil Ramah Orang Tua
 * - Tinggi minimal 56px (size default)
 * - Area sentuh minimal 48px
 * - Sudut membulat penuh (pill / rounded-full)
 * - Teks besar dan tebal
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-transform active:scale-[0.98] select-none disabled:pointer-events-none disabled:opacity-50 disabled:grayscale",
          // Varian gaya
          {
            // Primary Hitam Pejal bergaya iOS (Gambar 2)
            "bg-charcoal text-white hover:bg-black rounded-full shadow-sm":
              variant === "primary",
            // Aksen Kuning / Amber Hangat (Gambar 1)
            "bg-accent text-charcoal hover:bg-accent-hover rounded-full shadow-sm":
              variant === "accent",
            // Ghost Teks Polos tanpa kotak seperti "Nanti saja" (Gambar 2)
            "bg-transparent text-charcoal hover:bg-charcoal-100/50 rounded-full":
              variant === "ghost",
            // Secondary lembut
            "bg-charcoal-100 text-charcoal hover:bg-charcoal-200 rounded-full":
              variant === "secondary",
          },
          // Ukuran tombol
          {
            "min-h-[56px] px-8 text-lg": size === "default",
            "min-h-[48px] px-6 text-base": size === "sm",
            "min-h-[64px] px-10 text-xl": size === "lg",
            "h-12 w-12 p-0 rounded-full min-h-[48px] min-w-[48px]": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
