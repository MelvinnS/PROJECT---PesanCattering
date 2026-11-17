"use client";

import Link from "next/link";
import { User } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-charcoal-100/60 px-4 py-3.5 flex items-center justify-between transition-all">
      {/* Logo / Brand Name */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center text-accent font-black text-xl shadow-sm">
          DK
        </div>
        <span className="text-xl font-black tracking-tight text-charcoal">
          DK Catering
        </span>
      </Link>

      {/* Profil / Masuk button (Status asli dari sesi) */}
      <Link
        href={isLoggedIn ? "/profil" : "/masuk"}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-subtle hover:bg-charcoal-100 text-charcoal font-bold text-sm min-h-[44px] border border-charcoal-200/50 transition-colors"
      >
        <User className="w-4 h-4 text-charcoal" />
        <span>{isLoggedIn ? "Lihat Profil" : "Masuk"}</span>
      </Link>
    </header>
  );
}
