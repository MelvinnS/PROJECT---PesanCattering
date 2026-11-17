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
    <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
      <BackButton label="Kembali" fallbackUrl="/" />
      <Suspense fallback={<div className="p-8 text-center text-charcoal-400">Memuat form masuk...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
