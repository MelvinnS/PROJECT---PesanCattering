import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrderDetail } from "@/actions/order";
import { getCurrentCustomer } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Receipt, Utensils } from "lucide-react";

export const metadata = {
  title: "Pesanan Diproses - DK Catering",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const current = await getCurrentCustomer();
  if (!current) {
    redirect("/masuk");
  }

  const order = await getOrderDetail(params.orderNumber);
  if (!order) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-6">
      <div className="bg-white rounded-card p-6 sm:p-8 border border-charcoal-100 shadow-card text-center space-y-5 my-auto">
        {/* Ikon Sukses */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-in zoom-in-75">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* Judul Besar */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Pesanan Sedang Diproses
          </h1>
          <p className="text-charcoal-500 text-sm">
            Terima kasih! Dapur kami telah menerima pesanan masakan Anda.
          </p>
        </div>

        {/* Kartu Informasi ID & Nomor Pesanan */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-charcoal-200/80 space-y-3 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-charcoal-200/60">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              ID Pelanggan Anda
            </span>
            <span className="text-base font-black text-charcoal">
              {order.customerCode}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-charcoal-200/60">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Nomor Pesanan
            </span>
            <span className="text-base font-black text-accent-hover tracking-tight">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Alamat Pengantaran
            </span>
            <span className="text-sm font-semibold text-charcoal truncate max-w-[200px]">
              {order.maskedAddress}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-3 pt-3">
          {/* Tombol Pil Hitam: Pesan Menu Lain (Varian Primary) */}
          <Link href="/" className="block">
            <Button variant="primary" className="w-full">
              <Utensils className="w-5 h-5 mr-2" />
              <span>Pesan Menu Lain</span>
            </Button>
          </Link>

          {/* Tombol Sekunder Teks: Lihat Struk Pembelian (Varian Ghost) */}
          <Link href={`/pesanan/${order.orderNumber}/struk`} className="block">
            <Button variant="ghost" className="w-full text-base font-black">
              <Receipt className="w-5 h-5 mr-2" />
              <span>Lihat Struk Pembelian</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
