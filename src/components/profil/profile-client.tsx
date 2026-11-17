"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CustomerSessionData,
  MaskedAddress,
} from "@/lib/supabase/types";
import { CustomerOrderSummary, checkReorderAvailability } from "@/actions/order";
import {
  updateCustomerProfile,
  logoutAction,
} from "@/actions/auth";
import {
  addCustomerAddress,
  updateCustomerAddress,
  setDefaultAddress,
  deleteCustomerAddress,
} from "@/actions/address";
import { useCartStore } from "@/lib/store/use-cart-store";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  MapPin,
  Plus,
  Edit2,
  LogOut,
  ShoppingBag,
  Receipt,
  Repeat,
  AlertCircle,
} from "lucide-react";

interface ProfileClientProps {
  customer: CustomerSessionData;
  addresses: MaskedAddress[];
  orderHistory: CustomerOrderSummary[];
}

export function ProfileClient({
  customer,
  addresses,
  orderHistory,
}: ProfileClientProps) {
  const router = useRouter();
  const { addItem, clearCart } = useCartStore();

  // State Ubah Profil (Nama & WA)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editWa, setEditWa] = useState(customer.waNumber);
  const [profileLoading, setProfileLoading] = useState(false);

  // State Salin ID
  const [copiedId, setCopiedId] = useState(false);

  // State Pesan Seperti Ini Lagi (Reorder)
  const [reorderLoadingId, setReorderLoadingId] = useState<string | null>(null);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  // State Modal Tambah / Ubah Alamat
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [addrLabel, setAddrLabel] = useState("Rumah");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrHouseNumber, setAddrHouseNumber] = useState("");
  const [addrRtRw, setAddrRtRw] = useState("");
  const [addrKelurahan, setAddrKelurahan] = useState("");
  const [addrKecamatan, setAddrKecamatan] = useState("");
  const [addrCity, setAddrCity] = useState("Malang");
  const [addrDetailNote, setAddrDetailNote] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);

  // Alert & Pesan Umum
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Konfirmasi Logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Salin Customer Code
  const handleCopyId = () => {
    navigator.clipboard.writeText(customer.customerCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Simpan Perubahan Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateCustomerProfile(editName, editWa);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal memperbarui profil.");
      setProfileLoading(false);
      return;
    }

    setSuccessMsg("Profil berhasil diperbarui.");
    setIsEditingProfile(false);
    setProfileLoading(false);
    router.refresh();
  };

  // Buka Modal Tambah Alamat
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrLabel("Rumah");
    setAddrStreet("");
    setAddrHouseNumber("");
    setAddrRtRw("");
    setAddrKelurahan("");
    setAddrKecamatan("");
    setAddrCity("Malang");
    setAddrDetailNote("");
    setAddressModalOpen(true);
  };

  // Buka Modal Ubah Alamat (form kosong demi keamanan)
  const handleOpenEditAddress = (addrId: string, label: string) => {
    setEditingAddressId(addrId);
    setAddrLabel(label);
    setAddrStreet("");
    setAddrHouseNumber("");
    setAddrRtRw("");
    setAddrKelurahan("");
    setAddrKecamatan("");
    setAddrCity("Malang");
    setAddrDetailNote("");
    setAddressModalOpen(true);
  };

  // Simpan Alamat (Tambah / Ubah)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrLoading(true);
    setErrorMsg(null);

    let res;
    if (editingAddressId) {
      res = await updateCustomerAddress(editingAddressId, {
        label: addrLabel,
        street: addrStreet,
        houseNumber: addrHouseNumber,
        rtRw: addrRtRw,
        kelurahan: addrKelurahan,
        kecamatan: addrKecamatan,
        city: addrCity,
        detailNote: addrDetailNote,
      });
    } else {
      res = await addCustomerAddress({
        label: addrLabel,
        street: addrStreet,
        houseNumber: addrHouseNumber,
        rtRw: addrRtRw,
        kelurahan: addrKelurahan,
        kecamatan: addrKecamatan,
        city: addrCity,
        detailNote: addrDetailNote,
        isDefault: addresses.length === 0,
      });
    }

    if (!res.success) {
      setErrorMsg(res.error || "Gagal menyimpan alamat.");
      setAddrLoading(false);
      return;
    }

    setAddressModalOpen(false);
    setAddrLoading(false);
    setSuccessMsg("Alamat berhasil disimpan.");
    router.refresh();
  };

  // Jadikan Alamat Utama
  const handleSetDefault = async (addrId: string) => {
    const res = await setDefaultAddress(addrId);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal mengubah alamat utama.");
    } else {
      router.refresh();
    }
  };

  // Hapus Alamat
  const handleDeleteAddress = async (addrId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
    const res = await deleteCustomerAddress(addrId);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menghapus alamat.");
    } else {
      router.refresh();
    }
  };

  // Pesan Seperti Ini Lagi (Reorder)
  const handleReorder = async (order: CustomerOrderSummary) => {
    setReorderLoadingId(order.id);
    setReorderMessage(null);
    setErrorMsg(null);

    try {
      const res = await checkReorderAvailability(order.items);

      if (!res.success || res.availableItems.length === 0) {
        setErrorMsg("Maaf, menu dari riwayat pesanan ini tidak ada yang tersedia hari ini.");
        setReorderLoadingId(null);
        return;
      }

      // Masukkan item ke keranjang belanja
      res.availableItems.forEach((item) => {
        addItem({
          dailyMenuId: item.dailyMenuId,
          menuId: item.menuId,
          name: item.name,
          price: item.price,
          remainingQuota: item.remainingQuota,
          photoUrl: item.photoUrl,
        });
      });

      let notice = `Berhasil memasukkan ${res.availableItems.length} menu ke keranjang.`;
      if (res.unavailableMessages.length > 0) {
        notice += " (" + res.unavailableMessages.join(", ") + ")";
      }
      setReorderMessage(notice);

      setTimeout(() => {
        router.push("/pesan");
      }, 1500);
    } catch {
      setErrorMsg("Gagal memeriksa menu untuk pemesanan ulang.");
    } finally {
      setReorderLoadingId(null);
    }
  };

  // Handler Logout
  const handleLogout = async () => {
    await logoutAction();
    clearCart();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Pesan Sukses / Error */}
      {errorMsg && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-sm font-semibold text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center gap-3">
          <Check className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. INFORMASI PELANGGAN & ID */}
      <section className="bg-white rounded-card p-5 sm:p-6 border border-charcoal-100 shadow-card space-y-4">
        {/* ID Pelanggan (Tidak bisa diubah, Tampil Besar) */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-charcoal-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider block">
              ID Pelanggan Anda
            </span>
            <span className="text-2xl font-black text-charcoal tracking-tight">
              {customer.customerCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-charcoal-100 border border-charcoal-200 text-xs font-bold text-charcoal active:scale-95 transition-all shadow-xs"
          >
            {copiedId ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin ID</span>
              </>
            )}
          </button>
        </div>

        {/* Form Nama & Nomor WA */}
        {!isEditingProfile ? (
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-charcoal-400 font-bold uppercase">Nama Pelanggan</p>
                <p className="text-lg font-bold text-charcoal">{customer.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-charcoal-100">
              <div>
                <p className="text-xs text-charcoal-400 font-bold uppercase">Nomor WhatsApp</p>
                <p className="text-base font-bold text-charcoal">+{customer.waNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-charcoal-600 block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-bold text-charcoal"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal-600 block mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                required
                value={editWa}
                onChange={(e) => setEditWa(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-bold text-charcoal"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={profileLoading}
                variant="primary"
                className="flex-1 min-h-[44px] text-sm"
              >
                {profileLoading ? "Menyimpan..." : "Simpan Profil"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditingProfile(false)}
                className="min-h-[44px] text-sm"
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* 2. DAFTAR ALAMAT TERSIMPAN (DISAMARKAN) */}
      <section className="bg-white rounded-card p-5 sm:p-6 border border-charcoal-100 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent-hover" />
            <h2 className="text-lg font-black text-charcoal">Alamat Tersimpan</h2>
          </div>
          <button
            type="button"
            onClick={handleOpenAddAddress}
            className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Alamat</span>
          </button>
        </div>

        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3.5 rounded-2xl border border-charcoal-200 bg-surface-subtle/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal bg-white border border-charcoal-200 px-2 py-0.5 rounded">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-accent-hover bg-accent-light px-2 py-0.5 rounded-full">
                      Utama
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-bold text-charcoal-600 hover:text-charcoal underline"
                    >
                      Jadikan Utama
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEditAddress(addr.id, addr.label)}
                    className="text-xs font-bold text-accent-hover hover:underline"
                  >
                    Ubah
                  </button>
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-charcoal">
                {addr.maskedAddress}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. RIWAYAT PEMESANAN */}
      <section className="bg-white rounded-card p-5 sm:p-6 border border-charcoal-100 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent-hover" />
            <h2 className="text-lg font-black text-charcoal">Riwayat Pesanan</h2>
          </div>
          <span className="text-xs font-bold text-charcoal-400">
            {orderHistory.length} pesanan
          </span>
        </div>

        {reorderMessage && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
            {reorderMessage}
          </div>
        )}

        {orderHistory.length === 0 ? (
          <div className="text-center py-8 text-charcoal-400 space-y-1">
            <p className="text-sm font-bold text-charcoal">Belum ada riwayat pesanan.</p>
            <p className="text-xs">Pesanan Anda akan muncul di sini setelah dibuat.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orderHistory.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-charcoal-200/80 bg-white space-y-3 hover:border-charcoal-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-accent-hover">
                      {order.orderNumber}
                    </span>
                    <p className="text-xs text-charcoal-400 mt-0.5">
                      {formatTanggalIndonesia(new Date(order.createdAt))}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {order.orderStatus}
                  </span>
                </div>

                <div className="text-xs text-charcoal-600 line-clamp-2">
                  {order.itemsSummary}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-charcoal-100">
                  <span className="text-base font-black text-charcoal">
                    {formatRupiah(order.total)}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Tombol Pesan Seperti Ini Lagi */}
                    <button
                      type="button"
                      disabled={reorderLoadingId === order.id}
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-light hover:bg-accent/30 text-charcoal font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>
                        {reorderLoadingId === order.id ? "Memeriksa..." : "Pesan Lagi"}
                      </span>
                    </button>

                    {/* Tombol Buka Struk */}
                    <Link
                      href={`/pesanan/${order.orderNumber}/struk`}
                      className="p-1.5 rounded-full hover:bg-charcoal-100 text-charcoal"
                      title="Lihat Struk"
                    >
                      <Receipt className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. TOMBOL KELUAR (LOGOUT) */}
      <section className="pt-2">
        {!showLogoutConfirm ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 min-h-[52px]"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span>Keluar dari Akun</span>
          </Button>
        ) : (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
            <p className="text-sm font-bold text-red-900">
              Apakah Anda yakin ingin keluar dari akun ini di perangkat ini?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white min-h-[44px] text-sm"
              >
                Ya, Keluar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLogoutConfirm(false)}
                className="min-h-[44px] text-sm"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL TAMBAH / UBAH ALAMAT */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <h3 className="text-lg font-black text-charcoal">
                {editingAddressId ? "Ubah Alamat Lengkap" : "Tambah Alamat Rumah"}
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="text-sm font-bold text-charcoal-500 hover:text-charcoal"
              >
                Tutup
              </button>
            </div>

            {editingAddressId && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Demi keamanan privasi, silakan isi ulang detail alamat lengkap di bawah untuk memperbarui alamat ini.
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1">
                  Label Alamat
                </label>
                <input
                  type="text"
                  required
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Rumah, Kantor, dll"
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
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
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
                    placeholder="Contoh: 14"
                    value={addrHouseNumber}
                    onChange={(e) => setAddrHouseNumber(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    RT / RW (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="01/02"
                    value={addrRtRw}
                    onChange={(e) => setAddrRtRw(e.target.value)}
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
                    placeholder="Lowokwaru"
                    value={addrKecamatan}
                    onChange={(e) => setAddrKecamatan(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Kota / Kab *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal block mb-1">
                  Patokan / Petunjuk Kurir (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Depan pos satpam"
                  value={addrDetailNote}
                  onChange={(e) => setAddrDetailNote(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={addrLoading}
                  className="flex-1"
                  variant="primary"
                >
                  {addrLoading ? "Menyimpan..." : "Simpan Alamat"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddressModalOpen(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
