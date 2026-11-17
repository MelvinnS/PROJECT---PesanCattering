"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkOrLoginWa, registerCustomer } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight, CheckCircle2, AlertCircle, MapPin, User } from "lucide-react";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  // Step 1: Input Nomor WA, Step 2: Form Nama & Alamat Baru
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [waInput, setWaInput] = useState("");
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [rtRw, setRtRw] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [city, setCity] = useState("Malang");
  const [detailNote, setDetailNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  // Submit Step 1: Cek nomor WA
  const handleCheckWa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await checkOrLoginWa(waInput);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses nomor WhatsApp.");
        setLoading(false);
        return;
      }

      if (res.isRegistered) {
        // SUDAH TERDAFTAR: Sapa dan alihkan
        setWelcomeName(res.name || "Pelanggan");
        setTimeout(() => {
          router.push(nextUrl);
          router.refresh();
        }, 1200);
      } else {
        // BELUM TERDAFTAR: Pindah ke Langkah 2
        setStep(2);
        setLoading(false);
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi. Silakan coba kembali.");
      setLoading(false);
    }
  };

  // Submit Step 2: Pendaftaran Akun Baru + Alamat
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await registerCustomer({
        waNumber: waInput,
        name,
        street,
        houseNumber,
        rtRw,
        kelurahan,
        kecamatan,
        city,
        detailNote,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal mendaftarkan akun.");
        setLoading(false);
        return;
      }

      setWelcomeName(name);
      setTimeout(() => {
        router.push(nextUrl);
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  // Tampilan Sukses / Sapaan
  if (welcomeName) {
    return (
      <div className="bg-white rounded-card p-8 border border-charcoal-100 shadow-card text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black text-charcoal">
          Selamat datang kembali!
        </h2>
        <p className="text-lg font-bold text-accent-hover">{welcomeName}</p>
        <p className="text-charcoal-500 text-sm">
          Menyiapkan halaman Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-sm font-semibold text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= STEP 1: MASUK DENGAN NOMOR WA ================= */}
      {step === 1 && (
        <form onSubmit={handleCheckWa} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-charcoal tracking-tight">
              Masuk dengan Nomor WA
            </h1>
            <p className="text-charcoal-600 text-base">
              Tanpa repot kata sandi atau kode OTP. Masukkan nomor WhatsApp aktif Anda.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-charcoal block">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                autoFocus
                placeholder="Contoh: 0812 3456 7890"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                className="w-full min-h-[56px] pl-12 pr-4 rounded-2xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-lg font-bold text-charcoal outline-none transition-all"
              />
            </div>
            <p className="text-xs text-charcoal-500">
              Format: 08xx atau +628xx (10 - 15 digit angka).
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !waInput.trim()}
            className="w-full"
            variant="primary"
          >
            <span>{loading ? "Memeriksa..." : "Lanjut"}</span>
            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>
      )}

      {/* ================= STEP 2: PENDAFTARAN PELANGGAN BARU ================= */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-hover bg-accent-light px-3 py-1 rounded-full inline-block">
              Pelanggan Baru
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Lengkapi Data Pengiriman
            </h1>
            <p className="text-charcoal-600 text-sm sm:text-base">
              Nomor <span className="font-bold text-charcoal">{waInput}</span> belum terdaftar. Isi nama dan alamat untuk pengantaran katering.
            </p>
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-charcoal block">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: Ibu Hj. Aminah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[52px] pl-12 pr-4 rounded-2xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-base font-bold text-charcoal outline-none transition-all"
              />
            </div>
          </div>

          {/* Bagian Alamat Terpisah */}
          <div className="space-y-4 pt-2 border-t border-charcoal-100">
            <div className="flex items-center gap-2 text-charcoal font-black text-base">
              <MapPin className="w-5 h-5 text-accent-hover" />
              <span>Alamat Rumah Pengantaran</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Nama Jalan / Gang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Melati"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-charcoal-600 block mb-1">
                    Nomor Rumah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 14B"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal-600 block mb-1">
                    RT / RW (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="02/05"
                    value={rtRw}
                    onChange={(e) => setRtRw(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-charcoal-600 block mb-1">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lowokwaru"
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal-600 block mb-1">
                    Kota / Kabupaten *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Malang"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Kelurahan / Desa (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jatimulyo"
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-600 block mb-1">
                  Patokan / Petunjuk Kurir (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pagar hitam depan musholla"
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-surface-subtle border border-charcoal-200 focus:border-charcoal focus:bg-white text-sm font-semibold text-charcoal outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !name.trim() || !street.trim() || !houseNumber.trim() || !kecamatan.trim()}
              className="w-full"
              variant="primary"
            >
              <span>{loading ? "Menyimpan..." : "Daftar & Lanjut"}</span>
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep(1);
                setErrorMessage(null);
              }}
              className="w-full text-sm text-charcoal-500"
            >
              Ganti Nomor WhatsApp
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
