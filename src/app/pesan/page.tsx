import { getCurrentCustomer } from "@/lib/session";
import { getCustomerMaskedAddresses } from "@/actions/address";
import { OrderFlow } from "@/components/pesan/order-flow";
import { BackButton } from "@/components/shared/back-button";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Konfirmasi Pesanan - DK Catering",
};

export default async function PesanPage() {
  const customer = await getCurrentCustomer();

  // Guard: Jika belum login, alihkan ke /masuk?next=/pesan
  if (!customer) {
    redirect("/masuk?next=/pesan");
  }

  const addresses = await getCustomerMaskedAddresses();

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
      <BackButton label="Kembali ke Menu" fallbackUrl="/" />
      
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
          Konfirmasi Pesanan
        </h1>
        <p className="text-charcoal-500 text-xs sm:text-sm">
          Periksa porsi masakan dan alamat pengantaran katering Anda.
        </p>
      </div>

      <OrderFlow customer={customer} addresses={addresses} />
    </div>
  );
}
