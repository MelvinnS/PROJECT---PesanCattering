"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdminAction } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginAdminAction(formData);

    if (!res.success) {
      setErrorMessage(res.error || "Gagal masuk.");
      setLoading(false);
      return;
    }

    router.push(nextUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200/80 shadow-card space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-charcoal text-accent font-black text-2xl mx-auto flex items-center justify-center shadow-md">
          DK
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
          Login Admin DK
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500">
          Masuk dengan akun staf/pengelola terdaftar
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs sm:text-sm text-red-800 font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-charcoal-700 block">
            Email Administrator
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@dkcatering.com"
              className="w-full min-h-[50px] pl-11 pr-4 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold text-charcoal focus:bg-white focus:border-charcoal outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-charcoal-700 block">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full min-h-[50px] pl-11 pr-4 rounded-xl bg-surface-subtle border border-charcoal-200 text-sm font-semibold text-charcoal focus:bg-white focus:border-charcoal outline-none transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 shadow-md"
          variant="primary"
        >
          <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-charcoal-100">
        <Link
          href="/"
          className="text-xs font-semibold text-charcoal-400 hover:text-charcoal transition-colors"
        >
          Kembali ke Halaman Customer
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="p-8 text-center text-charcoal-400">Memuat login admin...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
