import { Suspense } from "react";
import { AuthForm } from "@/components/masuk/auth-form";
import { BackButton } from "@/components/shared/back-button";
import { getCurrentCustomer } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Masuk / Daftar - DK Catering",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const current = await getCurrentCustomer();
  if (current) {
    redirect(searchParams.next || "/");
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 w-full">
      <div className="w-full max-w-lg space-y-4">
        <BackButton label="Kembali" fallbackUrl="/" />
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-100 shadow-sm">
          <Suspense fallback={<div className="p-8 text-center text-charcoal-400">Memuat form masuk...</div>}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
