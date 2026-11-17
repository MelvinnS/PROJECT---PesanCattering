"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label?: string;
  fallbackUrl?: string;
}

export function BackButton({ label = "Kembali ke Beranda", fallbackUrl = "/" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="flex items-center gap-2 text-charcoal hover:bg-charcoal-100 font-bold px-4 py-2 min-h-[48px] self-start"
    >
      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
      <span>{label}</span>
    </Button>
  );
}
