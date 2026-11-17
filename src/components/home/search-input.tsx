"use client";

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari menu masakan...",
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400">
        <Search className="w-5 h-5 stroke-[2.2]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] pl-11 pr-10 py-2.5 bg-surface-subtle hover:bg-charcoal-100/60 focus:bg-white text-charcoal placeholder:text-charcoal-400 font-medium text-sm sm:text-base rounded-full border border-charcoal-200/60 focus:border-charcoal focus:outline-none transition-all shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-charcoal-400 hover:text-charcoal"
          aria-label="Hapus pencarian"
        >
          <div className="w-6 h-6 rounded-full bg-charcoal-200/60 flex items-center justify-center">
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </button>
      )}
    </div>
  );
}
