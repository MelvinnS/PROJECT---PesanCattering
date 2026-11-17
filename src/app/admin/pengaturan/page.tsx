"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoreSettings, updateStoreSettings, StoreSettings } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { generateOrderReceiptEscpos, createRawbtUrl } from "@/lib/escpos";
import {
  Settings,
  Printer,
  Check,
  AlertCircle,
  Smartphone,
  Save,
} from "lucide-react";

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "DK Catering",
    order_cutoff_time: "09:00",
    kitchen_lat: "-7.9666204",
    kitchen_lng: "112.6326321",
    delivery_fee_per_km: "3000",
    support_wa_number: "628991004545",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const data = await getStoreSettings();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateStoreSettings(settings);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menyimpan pengaturan.");
      setSaving(false);
      return;
    }

    setSuccessMsg("Pengaturan berhasil disimpan.");
    setSaving(false);
  };

  // CETAK UJI COBA PRINTER THERMAL 58MM
  const handleTestPrintRawbt = () => {
    const escpos = generateOrderReceiptEscpos({
      storeName: settings.store_name || "DK Catering",
      orderNumber: "DK-TEST-001",
      customerCode: "DK-0001",
      customerName: "Uji Coba Printer Thermal",
      waNumber: settings.support_wa_number,
      address: "Jl. Uji Coba Kertas Thermal No. 58, Malang (Lebar 32 Karakter)",
      orderDate: new Date().toLocaleString("id-ID"),
      paymentMethod: "cash",
      paymentStatus: "lunas",
      note: "Ini adalah struk uji coba printer Algoo 58mm.",
      items: [
        {
          name: "Ayam Goreng Lengkuas",
          quantity: 2,
          price: 28000,
          subtotal: 56000,
          note: "Uji coba cetak catatan item",
        },
        {
          name: "Sayur Asem Jakarta",
          quantity: 1,
          price: 12000,
          subtotal: 12000,
        },
      ],
      subtotal: 68000,
      deliveryFee: 0,
      total: 68000,
    });

    window.location.href = createRawbtUrl(escpos);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
          Pengaturan Usaha & Printer
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500">
          Kelola informasi toko, parameter operasional, dan uji coba printer struk thermal
        </p>
      </div>

      {/* FEEDBACK ALERT */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs sm:text-sm text-red-800 font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM PENGATURAN TOKO */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
          <Settings className="w-5 h-5 text-accent-hover" />
          <h2 className="text-lg font-black text-charcoal">
            Informasi Usaha & Operasional
          </h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-charcoal-400 text-sm">
            Memuat pengaturan...
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Nama Usaha / Toko
                </label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Nomor WhatsApp Bantuan (Customer Service)
                </label>
                <input
                  type="text"
                  required
                  placeholder="628xxxxxxxxxx"
                  value={settings.support_wa_number}
                  onChange={(e) => setSettings({ ...settings, support_wa_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Jam Tutup Pemesanan (Cut-off Time)
                </label>
                <input
                  type="time"
                  required
                  value={settings.order_cutoff_time}
                  onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-semibold"
                />
                <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                  * Parameter disimpan untuk implementasi logika jam tutup di tahap mendatang
                </span>
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Tarif Ongkir per Kilometer (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={settings.delivery_fee_per_km}
                  onChange={(e) => setSettings({ ...settings, delivery_fee_per_km: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-semibold"
                />
                <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                  * Nilai ongkir per km untuk kalkulasi jarak otomatis mendatang
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Latitude Dapur (Lokasi Utama)
                </label>
                <input
                  type="text"
                  value={settings.kitchen_lat}
                  onChange={(e) => setSettings({ ...settings, kitchen_lat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">
                  Longitude Dapur
                </label>
                <input
                  type="text"
                  value={settings.kitchen_lng}
                  onChange={(e) => setSettings({ ...settings, kitchen_lng: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="text-xs min-h-[44px] px-6 font-bold"
              >
                <Save className="w-4 h-4 mr-1.5" />
                <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* PENGATURAN PRINTER & UJI COBA CETAK RAWBT */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
          <Printer className="w-5 h-5 text-accent-hover" />
          <h2 className="text-lg font-black text-charcoal">
            Uji Coba Printer Thermal ESC/POS (58mm)
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-charcoal-600">
          <p>
            Struk dicetak menggunakan format ESC/POS standar dengan lebar 32 karakter per baris, cocok untuk printer thermal Bluetooth 58mm (seperti printer Algoo, Panda, Zjiang, atau POS-58).
          </p>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-charcoal-200/80 space-y-1.5 text-xs">
            <span className="font-bold text-charcoal block">Langkah Uji Coba:</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Pastikan Bluetooth HP Android aktif dan terhubung (paired) ke printer Algoo.</li>
              <li>Buka aplikasi <strong>RawBT</strong> di Android dan pilih printer Bluetooth Anda.</li>
              <li>Klik tombol <strong>&quot;Cetak Uji Coba (RawBT)&quot;</strong> di bawah.</li>
            </ol>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleTestPrintRawbt}
              className="text-xs min-h-[44px] px-5 font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              <Smartphone className="w-4 h-4 mr-1.5" />
              <span>Cetak Uji Coba (RawBT)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
