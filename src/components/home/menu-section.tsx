"use client";

import { useState, useMemo } from "react";
import { SearchInput } from "@/components/home/search-input";
import { MenuCard, MenuItemData } from "@/components/home/menu-card";
import { SearchX } from "lucide-react";

interface MenuSectionProps {
  initialMenus: MenuItemData[];
}

export function MenuSection({ initialMenus }: MenuSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return initialMenus;
    const q = searchQuery.toLowerCase().trim();
    return initialMenus.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [initialMenus, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Kolom Pencarian Menu */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Cari masakan hari ini..."
      />

      {/* Grid 2 Menu dalam 1 Baris di HP, responsif 3-4 kolom di Desktop */}
      {filteredMenus.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-surface-muted border border-charcoal-100">
          <div className="w-12 h-12 rounded-full bg-charcoal-100 text-charcoal-400 mx-auto flex items-center justify-center mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-charcoal mb-1">
            Menu tidak ditemukan
          </p>
          <p className="text-charcoal-500 text-xs">
            Tidak ada masakan dengan kata kunci &quot;{searchQuery}&quot;. Coba cari nama menu lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {filteredMenus.map((menu) => (
            <MenuCard key={menu.dailyMenuId} item={menu} />
          ))}
        </div>
      )}
    </div>
  );
}
