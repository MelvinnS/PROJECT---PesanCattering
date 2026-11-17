"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      variant="primary"
      className="w-full print:hidden"
    >
      <Printer className="w-5 h-5 mr-2" />
      <span>Cetak / Simpan Struk</span>
    </Button>
  );
}
