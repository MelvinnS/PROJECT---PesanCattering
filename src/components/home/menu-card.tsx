"use client";

import Image from "next/image";
import { Plus, Minus, UtensilsCrossed } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/use-cart-store";
import { useState } from "react";

export interface MenuItemData {
  dailyMenuId: string;
  menuId: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  quota: number;
  sold: number;
  isAvailable: boolean;
}

interface MenuCardProps {
  item: MenuItemData;
}

export function MenuCard({ item }: MenuCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const [imageError, setImageError] = useState(false);

  const cartItem = items.find((i) => i.dailyMenuId === item.dailyMenuId);
  const quantity = cartItem?.quantity || 0;

  const remainingQuota = Math.max(0, item.quota - item.sold);
  const isSoldOut = !item.isAvailable || remainingQuota <= 0;

  const handleIncrement = () => {
    if (quantity < remainingQuota) {
      if (quantity === 0) {
        addItem({
          dailyMenuId: item.dailyMenuId,
          menuId: item.menuId,
          name: item.name,
          price: item.price,
          remainingQuota,
          photoUrl: item.photoUrl,
        });
      } else {
        updateQuantity(item.dailyMenuId, quantity + 1);
      }
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(item.dailyMenuId, quantity - 1);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-2.5 sm:p-3 shadow-card border border-charcoal-100/70 flex flex-col justify-between transition-all h-full ${
        isSoldOut ? "opacity-75 bg-gray-50/70" : ""
      }`}
    >
      <div>
        {/* Gambar Menu */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-charcoal-100 mb-2">
          {item.photoUrl && !imageError ? (
            <Image
              src={item.photoUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform group-hover:scale-105 duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 text-amber-700 p-2 text-center">
              <UtensilsCrossed className="w-7 h-7 mb-1 opacity-50" />
              <span className="text-[11px] font-semibold">Foto Masakan</span>
            </div>
          )}

          {/* Badge Sisa Porsi atau Habis */}
          <div className="absolute top-1.5 right-1.5">
            {isSoldOut ? (
              <Badge variant="danger" className="text-[10px] sm:text-xs px-2 py-0.5 font-bold shadow-xs">
                Habis
              </Badge>
            ) : (
              <Badge
                variant={remainingQuota <= 5 ? "warning" : "default"}
                className="text-[10px] sm:text-xs px-2 py-0.5 font-bold shadow-xs"
              >
                Sisa {remainingQuota}
              </Badge>
            )}
          </div>
        </div>

        {/* Info Nama Menu */}
        <div className="mb-2">
          <h3 className="text-sm sm:text-base font-black text-charcoal tracking-tight leading-snug line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-charcoal-500 text-xs mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Harga & Kontrol Jumlah */}
      <div className="pt-2 border-t border-charcoal-100/80 mt-auto flex flex-col gap-2">
        <div>
          <span className="text-[11px] text-charcoal-400 font-medium block">
            Harga porsi
          </span>
          <span className="text-base sm:text-lg font-black text-charcoal tracking-tight">
            {formatRupiah(item.price)}
          </span>
        </div>

        {/* Kontrol Tambah / Kurang */}
        <div>
          {isSoldOut ? (
            <div className="w-full py-2 text-center text-charcoal-400 font-bold text-xs bg-charcoal-100/80 rounded-full select-none">
              Habis
            </div>
          ) : quantity === 0 ? (
            <button
              onClick={handleIncrement}
              className="w-full min-h-[44px] px-3 rounded-full bg-accent hover:bg-accent-hover text-charcoal font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-surface-subtle p-1 rounded-full border border-charcoal-200">
              <button
                onClick={handleDecrement}
                aria-label="Kurangi porsi"
                className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-full bg-white text-charcoal font-black flex items-center justify-center hover:bg-charcoal-100 active:scale-95 transition-transform shadow-xs"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="w-7 text-center font-black text-sm sm:text-base text-charcoal select-none">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= remainingQuota}
                aria-label="Tambah porsi"
                className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-full bg-accent text-charcoal font-black flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
