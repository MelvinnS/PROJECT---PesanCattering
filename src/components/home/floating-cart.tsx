"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/lib/store/use-cart-store";
import { useEffect, useState } from "react";

export function FloatingCart() {
  const { getTotalItems, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Mencegah mismatch hydration antara server & localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-charcoal text-white rounded-3xl p-3.5 sm:p-4 shadow-floating flex items-center justify-between gap-3 border border-charcoal-800">
          {/* Info Porsi & Total */}
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent text-charcoal font-black flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-medium">
                {totalItems} porsi dipilih
              </p>
              <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {formatRupiah(totalPrice)}
              </p>
            </div>
          </div>

          {/* Tombol Pil Hitam Pesan Sekarang (Varian Primary) */}
          <Link
            href="/pesan"
            className="min-h-[48px] sm:min-h-[52px] px-5 sm:px-7 rounded-full bg-white text-charcoal hover:bg-charcoal-100 font-black text-sm sm:text-base flex items-center gap-2 shrink-0 active:scale-95 transition-all shadow-md"
          >
            <span>Pesan Sekarang</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
