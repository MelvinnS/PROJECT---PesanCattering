import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/session";
import { getCustomerMaskedAddresses } from "@/actions/address";
import { getCustomerOrderHistory } from "@/actions/order";
import { ProfileClient } from "@/components/profil/profile-client";
import { BackButton } from "@/components/shared/back-button";

export const metadata = {
  title: "Profil Pelanggan - DK Catering",
};

export default async function ProfilPage() {
  const current = await getCurrentCustomer();

  // Wajib login: Jika tidak ada sesi, arahkan ke /masuk
  if (!current) {
    redirect("/masuk?next=/profil");
  }

  const [addresses, orderHistory] = await Promise.all([
    getCustomerMaskedAddresses(),
    getCustomerOrderHistory(),
  ]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
      <BackButton label="Kembali ke Beranda" fallbackUrl="/" />

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
          Profil Pelanggan
        </h1>
        <p className="text-charcoal-500 text-xs sm:text-sm">
          Kelola data diri, alamat pengantaran, dan riwayat pesanan Anda.
        </p>
      </div>

      <ProfileClient
        customer={current}
        addresses={addresses}
        orderHistory={orderHistory}
      />
    </div>
  );
}
