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
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
      <div className="max-w-[480px] mx-auto pointer-events-auto">
        <div className="bg-charcoal text-white rounded-3xl p-4 shadow-floating flex items-center justify-between gap-3 border border-charcoal-800">
          {/* Info Porsi & Total */}
          <div className="flex items-center gap-3 pl-1">
            <div className="w-12 h-12 rounded-full bg-accent text-charcoal font-black flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-medium">
                {totalItems} porsi dipilih
              </p>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {formatRupiah(totalPrice)}
              </p>
            </div>
          </div>

          {/* Tombol Pil Hitam Pesan Sekarang (Varian Primary) */}
          <Link
            href="/pesan"
            className="min-h-[52px] px-6 rounded-full bg-charcoal text-white hover:bg-black border border-charcoal-700 font-black text-base flex items-center gap-2 shrink-0 active:scale-95 transition-all shadow-md"
          >
            <span>Pesan Sekarang</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
