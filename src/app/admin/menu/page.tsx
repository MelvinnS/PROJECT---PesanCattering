"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  getMasterMenus,
  saveMasterMenu,
  getDailyMenusByDate,
  addMenuToDate,
  updateDailyMenu,
  deleteDailyMenu,
  copyDailyMenusFromDate,
  MasterMenuItem,
  AdminDailyMenuItem,
} from "@/actions/admin-menus";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Calendar,
  Copy,
  Edit2,
  Check,
  AlertCircle,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "master">("daily");

  // State Daily Menus
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dailyMenus, setDailyMenus] = useState<AdminDailyMenuItem[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);

  // Modal Tambah Menu ke Tanggal
  const [addDailyModalOpen, setAddDailyModalOpen] = useState(false);
  const [selectedMenuIdToAdd, setSelectedMenuIdToAdd] = useState("");
  const [quotaToAdd, setQuotaToAdd] = useState(30);

  // Modal Salin Menu dari Tanggal Lain
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [sourceDate, setSourceDate] = useState(todayStr);

  // State Master Menus
  const [masterMenus, setMasterMenus] = useState<MasterMenuItem[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);

  // Modal Tambah / Edit Master Menu
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [masterName, setMasterName] = useState("");
  const [masterDesc, setMasterDesc] = useState("");
  const [masterPrice, setMasterPrice] = useState(25000);
  const [masterPhotoUrl, setMasterPhotoUrl] = useState("");
  const [masterIsActive, setMasterIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pesan Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDailyMenus = useCallback(async (date: string) => {
    setDailyLoading(true);
    const data = await getDailyMenusByDate(date);
    setDailyMenus(data);
    setDailyLoading(false);
  }, []);

  const loadMasterMenus = useCallback(async () => {
    setMasterLoading(true);
    const data = await getMasterMenus();
    setMasterMenus(data);
    setMasterLoading(false);
  }, []);

  useEffect(() => {
    loadDailyMenus(selectedDate);
    loadMasterMenus();
  }, [selectedDate, loadDailyMenus, loadMasterMenus]);

  // Tambah Menu ke Tanggal
  const handleAddDailyMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuIdToAdd) return;
    setErrorMsg(null);

    const res = await addMenuToDate(selectedDate, selectedMenuIdToAdd, quotaToAdd);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menambahkan menu.");
      return;
    }

    setAddDailyModalOpen(false);
    setSelectedMenuIdToAdd("");
    setQuotaToAdd(30);
    setSuccessMsg("Menu berhasil ditambahkan ke tanggal terpilih.");
    loadDailyMenus(selectedDate);
  };

  // Salin Menu dari Tanggal Lain
  const handleCopyFromDate = async () => {
    if (sourceDate === selectedDate) {
      setErrorMsg("Tanggal sumber harus berbeda dengan tanggal tujuan.");
      return;
    }
    setErrorMsg(null);

    const res = await copyDailyMenusFromDate(sourceDate, selectedDate);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menyalin menu.");
      return;
    }

    setCopyModalOpen(false);
    setSuccessMsg(`Berhasil menyalin ${res.count || 0} menu ke tanggal ${selectedDate}.`);
    loadDailyMenus(selectedDate);
  };

  // Update Kuota Daily Menu Langsung
  const handleUpdateQuota = async (item: AdminDailyMenuItem, newQuota: number) => {
    const res = await updateDailyMenu(item.id, newQuota, item.isAvailable);
    if (res.success) {
      setDailyMenus((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, quota: newQuota } : d))
      );
    }
  };

  // Toggle Ketersediaan Daily Menu
  const handleToggleAvailable = async (item: AdminDailyMenuItem) => {
    const nextVal = !item.isAvailable;
    const res = await updateDailyMenu(item.id, item.quota, nextVal);
    if (res.success) {
      setDailyMenus((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, isAvailable: nextVal } : d))
      );
    }
  };

  // Hapus Daily Menu
  const handleDeleteDaily = async (id: string) => {
    if (!confirm("Hapus menu ini dari tanggal terpilih?")) return;
    setErrorMsg(null);
    const res = await deleteDailyMenu(id);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menghapus.");
      return;
    }
    loadDailyMenus(selectedDate);
  };

  // Kompres Gambar di Sisi Klien & Upload ke Supabase Storage (menu-photos)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar melebihi batas 2 MB.");
      return;
    }

    setUploadingImage(true);
    try {
      // Kompres sederhana via Canvas
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                setUploadingImage(false);
                return;
              }

              const supabase = createClient();
              const fileName = `menu_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

              const { data, error: uploadError } = await supabase.storage
                .from("menu-photos")
                .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

              if (uploadError) {
                alert("Gagal mengupload foto: " + uploadError.message);
                setUploadingImage(false);
                return;
              }

              const { data: publicUrlData } = supabase.storage
                .from("menu-photos")
                .getPublicUrl(data.path);

              setMasterPhotoUrl(publicUrlData.publicUrl);
              setUploadingImage(false);
            },
            "image/jpeg",
            0.8
          );
        };
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Terjadi kesalahan saat memproses gambar.");
      setUploadingImage(false);
    }
  };

  // Simpan Master Menu
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await saveMasterMenu({
      id: editingMasterId || undefined,
      name: masterName,
      description: masterDesc,
      price: masterPrice,
      photoUrl: masterPhotoUrl,
      isActive: masterIsActive,
    });

    if (!res.success) {
      setErrorMsg(res.error || "Gagal menyimpan menu master.");
      return;
    }

    setMasterModalOpen(false);
    setSuccessMsg("Master menu berhasil disimpan.");
    loadMasterMenus();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & TAB TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Pengelolaan Menu
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Atur menu harian dan kelola katalog resep masakan DK Catering
          </p>
        </div>

        <div className="flex bg-surface-subtle p-1 rounded-full border border-charcoal-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "daily"
                ? "bg-charcoal text-white shadow-xs"
                : "text-charcoal-500 hover:text-charcoal"
            }`}
          >
            Menu Harian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "master"
                ? "bg-charcoal text-white shadow-xs"
                : "text-charcoal-500 hover:text-charcoal"
            }`}
          >
            Master Menu ({masterMenus.length})
          </button>
        </div>
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

      {/* ================= TAB 1: MENU HARIAN ================= */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {/* BAR FILTER TANGGAL & AKSI */}
          <div className="bg-white p-4 rounded-2xl border border-charcoal-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-hover" />
              <span className="text-xs font-bold text-charcoal">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-charcoal-200 text-xs font-bold bg-surface-subtle"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCopyModalOpen(true)}
                className="text-xs min-h-[42px] px-4 font-bold"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                <span>Salin dari Hari Lain</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setAddDailyModalOpen(true)}
                className="text-xs min-h-[42px] px-4 font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Tambah Menu</span>
              </Button>
            </div>
          </div>

          {/* DAFTAR MENU HARIAN */}
          {dailyLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl text-charcoal-400 text-sm">
              Memuat menu harian...
            </div>
          ) : dailyMenus.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-charcoal-100 shadow-sm space-y-3">
              <UtensilsCrossed className="w-12 h-12 text-charcoal-300 mx-auto" />
              <p className="font-bold text-charcoal">
                Belum ada menu yang diatur untuk tanggal ini.
              </p>
              <p className="text-xs text-charcoal-400 max-w-sm mx-auto">
                Silakan tambah menu dari katalog master atau gunakan tombol &quot;Salin dari Hari Lain&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyMenus.map((dm) => (
                <div
                  key={dm.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-col justify-between transition-all ${
                    dm.isAvailable ? "border-charcoal-100" : "border-gray-200 bg-gray-50/70 opacity-60"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-charcoal-100 shrink-0">
                      {dm.photoUrl ? (
                        <Image
                          src={dm.photoUrl}
                          alt={dm.menuName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-700">
                          <UtensilsCrossed className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-charcoal text-sm leading-snug truncate">
                        {dm.menuName}
                      </h4>
                      <p className="text-xs font-bold text-accent-hover mt-0.5">
                        {formatRupiah(dm.menuPrice)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="font-semibold text-charcoal-500">
                          Terjual: <b>{dm.sold}</b>
                        </span>
                        <span>&bull;</span>
                        <span className="font-semibold text-charcoal-500">
                          Sisa: <b>{Math.max(0, dm.quota - dm.sold)}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KONTROL KUOTA & STATUS */}
                  <div className="pt-3 mt-3 border-t border-charcoal-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-charcoal-600">Kuota:</span>
                      <input
                        type="number"
                        min={dm.sold}
                        value={dm.quota}
                        onChange={(e) =>
                          handleUpdateQuota(dm, parseInt(e.target.value) || dm.sold)
                        }
                        className="w-16 px-2 py-1 rounded-lg border border-charcoal-200 font-black text-center"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(dm)}
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          dm.isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {dm.isAvailable ? "Aktif" : "Nonaktif"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDaily(dm.id)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MASTER MENU ================= */}
      {activeTab === "master" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-charcoal-100 shadow-sm">
            <div>
              <h3 className="font-black text-charcoal text-base">Katalog Resep Master</h3>
              <p className="text-xs text-charcoal-400">Total {masterMenus.length} masakan terdaftar</p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingMasterId(null);
                setMasterName("");
                setMasterDesc("");
                setMasterPrice(25000);
                setMasterPhotoUrl("");
                setMasterIsActive(true);
                setMasterModalOpen(true);
              }}
              className="text-xs min-h-[42px] px-4 font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Tambah Master Baru</span>
            </Button>
          </div>

          {masterLoading ? (
            <div className="bg-white p-12 text-center rounded-2xl text-charcoal-400 text-sm">
              Memuat katalog menu...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masterMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white rounded-2xl p-4 border border-charcoal-100 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-charcoal-100 shrink-0">
                      {menu.photoUrl ? (
                        <Image
                          src={menu.photoUrl}
                          alt={menu.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-700">
                          <UtensilsCrossed className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-charcoal text-sm leading-snug truncate">
                        {menu.name}
                      </h4>
                      <p className="text-xs font-bold text-accent-hover mt-0.5">
                        {formatRupiah(menu.price)}
                      </p>
                      {menu.description && (
                        <p className="text-[11px] text-charcoal-400 line-clamp-2 mt-1">
                          {menu.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-charcoal-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        menu.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {menu.isActive ? "Aktif" : "Nonaktif"}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingMasterId(menu.id);
                        setMasterName(menu.name);
                        setMasterDesc(menu.description || "");
                        setMasterPrice(menu.price);
                        setMasterPhotoUrl(menu.photoUrl || "");
                        setMasterIsActive(menu.isActive);
                        setMasterModalOpen(true);
                      }}
                      className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH MENU KE HARIAN */}
      {addDailyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-lg text-charcoal">
              Tambah Menu ({selectedDate})
            </h3>
            <form onSubmit={handleAddDailyMenu} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Pilih dari Master Menu
                </label>
                <select
                  required
                  value={selectedMenuIdToAdd}
                  onChange={(e) => setSelectedMenuIdToAdd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-sm font-semibold"
                >
                  <option value="">-- Pilih Menu --</option>
                  {masterMenus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatRupiah(m.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Kuota Porsi Harian
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quotaToAdd}
                  onChange={(e) => setQuotaToAdd(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-sm font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" className="flex-1 text-xs">
                  Simpan ke Tanggal
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddDailyModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SALIN DARI HARI LAIN */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-lg text-charcoal">
              Salin Menu dari Hari Lain
            </h3>
            <p className="text-xs text-charcoal-500">
              Menyalin semua menu dan kuota dari tanggal sumber ke tanggal tujuan (<strong>{selectedDate}</strong>). Jumlah terjual akan dimulai dari 0.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Tanggal Sumber
                </label>
                <input
                  type="date"
                  value={sourceDate}
                  onChange={(e) => setSourceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-sm font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCopyFromDate}
                  className="flex-1 text-xs"
                >
                  Mulai Salin
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCopyModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / UBAH MASTER MENU */}
      {masterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 my-auto">
            <h3 className="font-black text-lg text-charcoal">
              {editingMasterId ? "Ubah Master Menu" : "Tambah Master Menu"}
            </h3>

            <form onSubmit={handleSaveMaster} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Nama Masakan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rendang Daging Sapi"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Harga Satuan (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={masterPrice}
                  onChange={(e) => setMasterPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Deskripsi Masakan
                </label>
                <textarea
                  rows={2}
                  placeholder="Bumbu rempah gurih, empuk ramah lansia"
                  value={masterDesc}
                  onChange={(e) => setMasterDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-xs font-medium"
                />
              </div>

              {/* UPLOAD FOTO DENGAN KOMPRESI SISI KLIEN */}
              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Foto Masakan (Maks 2 MB, Otomatis Kompres)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  {masterPhotoUrl && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-charcoal-100 shrink-0 border border-charcoal-200">
                      <Image
                        src={masterPhotoUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="text-xs min-h-[38px] px-3 font-bold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>{uploadingImage ? "Mengompres & Upload..." : "Pilih File Foto"}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={masterIsActive}
                  onChange={(e) => setMasterIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-accent"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-charcoal">
                  Aktifkan di katalog
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" className="flex-1 text-xs">
                  Simpan Master
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMasterModalOpen(false)}
                  className="text-xs"
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
