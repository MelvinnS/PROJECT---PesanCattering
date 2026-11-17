"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store/use-cart-store";
import { submitOrder } from "@/actions/order";
import { addCustomerAddress } from "@/actions/address";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MaskedAddress, CustomerSessionData } from "@/lib/supabase/types";
import {
  Plus,
  Minus,
  Trash2,
  MapPin,
  Check,
  AlertCircle,
  Banknote,
  QrCode,
  Landmark,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

interface OrderFlowProps {
  customer: CustomerSessionData;
  addresses: MaskedAddress[];
}

export function OrderFlow({ customer, addresses: initialAddresses }: OrderFlowProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  const addresses = initialAddresses;
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || "");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // Form Tambah Alamat Baru
  const [label, setLabel] = useState("Rumah");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [rtRw, setRtRw] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [city, setCity] = useState("Malang");
  const [detailNote, setDetailNote] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Catatan Pesanan
  const [orderNote, setOrderNote] = useState("");

  // Proses Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = getTotalPrice();
  const deliveryFee = 0; // Tahap 2: delivery_fee = 0 dulu
  const total = subtotal + deliveryFee;

  const currentAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddr;

  // Handler Simpan Alamat Baru
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setErrorMessage(null);

    const res = await addCustomerAddress({
      label,
      street,
      houseNumber,
      rtRw,
      kelurahan,
      kecamatan,
      city,
      detailNote,
      isDefault: true,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Gagal menyimpan alamat.");
      setIsSavingAddress(false);
      return;
    }

    // Refresh halaman agar list alamat terbarui
    router.refresh();
    setShowAddAddressForm(false);
    setShowAddressModal(false);
    setIsSavingAddress(false);
  };

  // Handler Submit Pesanan (Mencegah Klik Ganda)
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    if (!currentAddress) {
      setErrorMessage("Silakan pilih alamat pengantaran terlebih dahulu.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Keranjang pesanan masih kosong.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderItems = items.map((i) => ({
        menu_id: i.menuId,
        quantity: i.quantity,
      }));

      const res = await submitOrder(currentAddress.id, orderItems, orderNote);

      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses pesanan.");
        setIsSubmitting(false);
        return;
      }

      // Kosongkan keranjang setelah pesanan berhasil
      clearCart();
      router.push(`/pesanan/${res.orderNumber}`);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat memproses pesanan.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 text-center rounded-card bg-white border border-charcoal-100 shadow-card space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 text-accent-hover mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-charcoal">Keranjang masih kosong</h2>
        <p className="text-charcoal-500 text-sm max-w-xs mx-auto">
          Silakan pilih menu masakan harian favorit Anda terlebih dahulu.
        </p>
        <Link href="/" className="inline-block pt-2">
          <Button variant="primary">Lihat Menu Hari Ini</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {errorMessage && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-sm font-semibold text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid 2 Kolom di Desktop (Kiri: Keranjang, Kanan: Alamat, Pembayaran & Rincian) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Rincian Keranjang */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. RINGKASAN KERANJANG */}
          <section className="bg-white rounded-3xl p-4 sm:p-6 border border-charcoal-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <h2 className="text-lg sm:text-xl font-black text-charcoal tracking-tight">
                Pesanan Anda ({items.reduce((acc, i) => acc + i.quantity, 0)} Porsi)
              </h2>
              <Link href="/" className="text-xs sm:text-sm font-bold text-accent-hover hover:underline">
                + Tambah Menu
              </Link>
            </div>

            <div className="divide-y divide-charcoal-100">
              {items.map((item) => (
                <div key={item.dailyMenuId} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-charcoal text-sm sm:text-base leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-charcoal-500 mt-0.5">
                      {formatRupiah(item.price)} x {item.quantity}
                    </p>
                    <p className="text-sm sm:text-base font-black text-charcoal mt-1">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Kontrol Jumlah */}
                  <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-full border border-charcoal-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeItem(item.dailyMenuId);
                        } else {
                          updateQuantity(item.dailyMenuId, item.quantity - 1);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white text-charcoal flex items-center justify-center active:scale-95 transition-transform"
                      aria-label="Kurangi"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                    <span className="w-6 text-center font-black text-sm select-none">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.dailyMenuId, item.quantity + 1)}
                      disabled={item.quantity >= item.remainingQuota}
                      className="w-8 h-8 rounded-full bg-accent text-charcoal flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                      aria-label="Tambah"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. CATATAN PEMESANAN */}
          <section className="bg-white rounded-3xl p-4 sm:p-6 border border-charcoal-100 shadow-sm space-y-2">
            <label className="text-sm font-bold text-charcoal block">
              Catatan untuk Dapur (Opsional)
            </label>
            <input
              type="text"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Contoh: Tanpa pedas, nasi lembek, pisah sambal"
              className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none transition-all"
            />
          </section>
        </div>

        {/* Kolom Kanan: Alamat, Pembayaran & Rincian Biaya */}
        <div className="lg:col-span-5 space-y-4">
          {/* 2. DATA PELANGGAN & ALAMAT PENGANTARAN (DISAMARKAN) */}
          <section className="bg-white rounded-3xl p-4 sm:p-6 border border-charcoal-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent-hover" />
                <h2 className="text-base sm:text-lg font-black text-charcoal">
                  Alamat Pengantaran
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-bold text-accent-hover hover:underline"
              >
                Ganti Alamat
              </button>
            </div>

            <div>
              <p className="text-xs text-charcoal-400 font-semibold uppercase tracking-wider">
                Penerima
              </p>
              <p className="text-base font-bold text-charcoal">{customer.name}</p>
              <p className="text-xs text-charcoal-500 font-medium">
                +{customer.waNumber} (ID: {customer.customerCode})
              </p>
            </div>

            <div className="pt-2 border-t border-charcoal-100">
              <p className="text-xs text-charcoal-400 font-semibold uppercase tracking-wider">
                Alamat ({currentAddress?.label || "Utama"})
              </p>
              {currentAddress ? (
                <p className="text-sm font-semibold text-charcoal mt-0.5 leading-relaxed">
                  {currentAddress.maskedAddress}
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold mt-0.5">
                  Belum ada alamat dipilih.
                </p>
              )}
              <span className="text-[11px] text-charcoal-400 block mt-1">
                * Alamat lengkap disamarkan demi keamanan data Anda.
              </span>
            </div>
          </section>

          {/* 4. METODE PEMBAYARAN */}
          <section className="bg-white rounded-3xl p-4 sm:p-6 border border-charcoal-100 shadow-sm space-y-3">
            <h2 className="text-base sm:text-lg font-black text-charcoal">
              Metode Pembayaran
            </h2>

            <div className="space-y-2.5">
              {/* Opsi 1: Tunai ke Kurir (Aktif) */}
              <div className="p-3.5 rounded-2xl border-2 border-charcoal bg-amber-50/30 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent text-charcoal flex items-center justify-center">
                    <Banknote className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="font-black text-charcoal text-sm sm:text-base">
                      Tunai ke Kurir (Cash)
                    </p>
                    <p className="text-xs text-charcoal-500">
                      Bayar langsung saat makanan tiba di rumah
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-charcoal text-white flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              {/* Opsi 2: BCA VA (Segera Hadir) */}
              <div className="p-3 rounded-2xl border border-charcoal-200 bg-gray-50 opacity-55 flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-charcoal-100 text-charcoal-400 flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-charcoal-700 text-xs sm:text-sm">Transfer BCA VA</p>
                    <p className="text-[11px] text-charcoal-400">Virtual account otomatis</p>
                  </div>
                </div>
                <span className="text-[10px] bg-charcoal-200 text-charcoal-600 px-2 py-0.5 rounded-full font-bold">
                  Segera hadir
                </span>
              </div>

              {/* Opsi 3: QRIS (Segera Hadir) */}
              <div className="p-3 rounded-2xl border border-charcoal-200 bg-gray-50 opacity-55 flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-charcoal-100 text-charcoal-400 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-charcoal-700 text-xs sm:text-sm">QRIS</p>
                    <p className="text-[11px] text-charcoal-400">GoPay, OVO, BCA, Livin</p>
                  </div>
                </div>
                <span className="text-[10px] bg-charcoal-200 text-charcoal-600 px-2 py-0.5 rounded-full font-bold">
                  Segera hadir
                </span>
              </div>
            </div>
          </section>

          {/* 5. RINGKASAN BIAYA & TOMBOL PESAN */}
          <section className="bg-white rounded-3xl p-4 sm:p-6 border border-charcoal-100 shadow-sm space-y-3">
            <h2 className="text-base sm:text-lg font-black text-charcoal pb-2 border-b border-charcoal-100">
              Rincian Pembayaran
            </h2>
            <div className="flex justify-between text-sm text-charcoal-600">
              <span>Subtotal Menu</span>
              <span className="font-bold text-charcoal">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal-600">
              <span>Biaya Ongkir</span>
              <span className="font-semibold text-accent-hover">Dihitung nanti (Gratis promo)</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-black text-charcoal pt-2 border-t border-charcoal-100">
              <span>Total Pembayaran</span>
              <span className="text-xl sm:text-2xl text-charcoal">{formatRupiah(total)}</span>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full shadow-lg"
                variant="primary"
              >
                <span>{isSubmitting ? "Memproses Pesanan..." : "Lanjut Pesan Sekarang"}</span>
                {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL GANTI / TAMBAH ALAMAT */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <h3 className="text-lg font-black text-charcoal">
                {showAddAddressForm ? "Tambah Alamat Baru" : "Pilih Alamat Pengantaran"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setShowAddAddressForm(false);
                }}
                className="text-sm font-bold text-charcoal-500 hover:text-charcoal"
              >
                Tutup
              </button>
            </div>

            {!showAddAddressForm ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setShowAddressModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                      selectedAddressId === addr.id
                        ? "border-charcoal bg-amber-50/40"
                        : "border-charcoal-200 hover:border-charcoal-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-charcoal bg-charcoal-100 px-2 py-0.5 rounded">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-accent-hover bg-accent-light px-2 py-0.5 rounded-full">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-charcoal mt-1.5">
                        {addr.maskedAddress}
                      </p>
                    </div>
                    {selectedAddressId === addr.id && (
                      <div className="w-5 h-5 rounded-full bg-charcoal text-white flex items-center justify-center mt-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddAddressForm(true)}
                  className="w-full text-sm font-bold"
                >
                  + Tambah Alamat Baru
                </Button>
              </div>
            ) : (
              /* FORM TAMBAH ALAMAT */
              <form onSubmit={handleSaveNewAddress} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Label Alamat (Rumah, Kantor, dsb)
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Nama Jalan / Gang *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Ijen"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      No. Rumah *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="45"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      RT / RW
                    </label>
                    <input
                      type="text"
                      placeholder="01/02"
                      value={rtRw}
                      onChange={(e) => setRtRw(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Kecamatan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Klojen"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Kota *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Kelurahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Oro-oro Dowo"
                    value={kelurahan}
                    onChange={(e) => setKelurahan(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Patokan Kurir (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pagar hitam depan pos satpam"
                    value={detailNote}
                    onChange={(e) => setDetailNote(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingAddress}
                    className="flex-1"
                    variant="primary"
                  >
                    {isSavingAddress ? "Menyimpan..." : "Simpan Alamat"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddAddressForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
