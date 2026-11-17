"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  waNumber?: string;
}

export function WhatsAppButton({ waNumber }: WhatsAppButtonProps) {
  const number =
    waNumber || process.env.NEXT_PUBLIC_WA_NUMBER || "6281234567890";
  const message = encodeURIComponent(
    "Halo DK Catering, saya ingin bertanya tentang menu hari ini."
  );
  const waUrl = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full min-h-[56px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-all px-6 py-3.5 select-none"
    >
      <MessageCircle className="w-6 h-6 stroke-[2.2]" />
      <span>Bantuan via WhatsApp</span>
    </a>
  );
}
