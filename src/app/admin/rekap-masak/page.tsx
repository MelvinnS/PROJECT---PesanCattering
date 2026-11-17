"use client";

import { useEffect, useState, useCallback } from "react";
import { getCookingRecapData, CookingRecapItem } from "@/actions/admin-rekap";
import { Button } from "@/components/ui/button";
import { Printer, Calendar, ChefHat, AlertCircle } from "lucide-react";

export default function AdminRekapMasakPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [items, setItems] = useState<CookingRecapItem[]>([]);
  const [totalPortions, setTotalPortions] = useState(0);
  const [specialNotes, setSpecialNotes] = useState<Array<{ orderNumber: string; note: string }>>([]);
  const [dateFormatted, setDateFormatted] = useState("");
  const [rawbtUrl, setRawbtUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRecap = useCallback(async (date: string) => {
    setLoading(true);
    const data = await getCookingRecapData(date);
    setItems(data.items);
    setTotalPortions(data.totalPortions);
    setSpecialNotes(data.specialNotes);
    setDateFormatted(data.dateFormatted);
    setRawbtUrl(data.rawbtUrl);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecap(selectedDate);
  }, [selectedDate, loadRecap]);

  const handlePrintRawbt = () => {
    if (!rawbtUrl) return;
    window.location.href = rawbtUrl;
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & KONTROL TANGGAL (SEMBUNYI SAAT PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Rekap Masak Dapur
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Total porsi per menu untuk tim masak jam 2 pagi (Pesanan batal otomatis tidak dihitung)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-charcoal-200">
            <Calendar className="w-4 h-4 text-accent-hover" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold border-none bg-transparent focus:outline-none"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrintRawbt}
            disabled={items.length === 0}
            className="text-xs min-h-[40px] px-3.5 font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Cetak RawBT</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handlePrintBrowser}
            disabled={items.length === 0}
            className="text-xs min-h-[40px] px-3.5 font-bold"
          >
            <span>Cetak Halaman</span>
          </Button>
        </div>
      </div>

      {/* KARTU TOTAL PORSI BESAR */}
      <div className="bg-charcoal text-white rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between print:bg-white print:text-black print:border-b-2 print:border-black print:rounded-none">
        <div>
          <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider block">
            Total Porsi yang Harus Dimasak
          </span>
          <span className="text-xs text-accent font-semibold block mt-0.5">
            {dateFormatted}
          </span>
        </div>
        <div className="text-right">
          <span className="text-4xl sm:text-5xl font-black text-accent print:text-black tracking-tight">
            {totalPortions}
          </span>
          <span className="text-xs text-white/70 block">Porsi</span>
        </div>
      </div>

      {/* TABEL REKAP MASAK DENGAN FONT BESAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-100 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
          <ChefHat className="w-5 h-5 text-accent-hover" />
          <h2 className="text-lg font-black text-charcoal">
            Daftar Masakan & Jumlah Porsi
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-charcoal-400 text-sm">
            Memuat data rekap masak...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-charcoal-400 text-sm space-y-1">
            <p className="font-bold text-charcoal">Belum ada pesanan untuk tanggal ini.</p>
            <p className="text-xs">Data akan terakumulasi otomatis saat pelanggan memesan.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-charcoal-100 font-sans">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <span className="text-lg sm:text-xl font-black text-charcoal tracking-tight block">
                    {item.menuName}
                  </span>
                  {item.notes.length > 0 && (
                    <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                      {item.notes.length} permintaan khusus
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
                    {item.totalPortions}
                  </span>
                  <span className="text-xs font-bold text-charcoal-400 block">
                    Porsi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CATATAN KHUSUS PELANGGAN */}
      {specialNotes.length > 0 && (
        <div className="bg-amber-50 rounded-3xl p-5 sm:p-6 border border-amber-200 space-y-3 print:bg-white print:border-t-2 print:border-black print:rounded-none">
          <div className="flex items-center gap-2 text-amber-900 font-black text-base">
            <AlertCircle className="w-5 h-5 text-accent-hover" />
            <span>Catatan Khusus Pelanggan ({specialNotes.length} Catatan)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {specialNotes.map((sn, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1"
              >
                <span className="text-xs font-bold text-accent-hover">
                  {sn.orderNumber}
                </span>
                <p className="text-sm font-semibold text-charcoal italic">
                  &ldquo;{sn.note}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
