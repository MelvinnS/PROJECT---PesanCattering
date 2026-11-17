"use client";

import { useState } from "react";
import { recordOrderPrint } from "@/actions/admin-orders";
import { Printer, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PrintReceiptClientProps {
  orderId: string;
  orderNumber: string;
  printCount: number;
  rawbtUrl: string;
}

export function PrintReceiptClient({
  orderId,
  printCount: initialPrintCount,
  rawbtUrl,
}: PrintReceiptClientProps) {
  const [printCount, setPrintCount] = useState(initialPrintCount);

  const handlePrintRawbt = async () => {
    if (printCount > 0) {
      if (!confirm(`Pesanan ini sudah pernah dicetak (${printCount}x). Cetak ulang sekarang?`)) {
        return;
      }
    }

    // Catat print ke database
    const res = await recordOrderPrint(orderId);
    if (res.success) {
      setPrintCount(res.printCount);
    }

    // Buka aplikasi RawBT di Android
    window.location.href = rawbtUrl;
  };

  const handlePrintBrowser = async () => {
    if (printCount > 0) {
      if (!confirm(`Pesanan ini sudah pernah dicetak (${printCount}x). Cetak ulang sekarang?`)) {
        return;
      }
    }

    const res = await recordOrderPrint(orderId);
    if (res.success) {
      setPrintCount(res.printCount);
    }

    window.print();
  };

  return (
    <div className="w-full max-w-sm space-y-3 mb-3 print:hidden">
      <Link href="/admin/pesanan">
        <Button variant="ghost" className="w-full text-xs font-bold mb-1">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Kembali ke Daftar Pesanan</span>
        </Button>
      </Link>

      <div className="p-3 bg-white rounded-2xl border border-charcoal-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-charcoal-400 font-bold block">Status Cetak</span>
          <span className="text-sm font-bold text-charcoal">
            {printCount > 0 ? `Sudah dicetak (${printCount}x)` : "Belum pernah dicetak"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={handlePrintRawbt}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px] text-xs font-bold"
        >
          <Smartphone className="w-4 h-4 mr-1.5" />
          <span>Cetak RawBT</span>
        </Button>

        <Button
          type="button"
          onClick={handlePrintBrowser}
          className="bg-charcoal text-white hover:bg-black min-h-[48px] text-xs font-bold"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          <span>Cetak Browser</span>
        </Button>
      </div>
    </div>
  );
}
