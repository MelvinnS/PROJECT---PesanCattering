import { notFound, redirect } from "next/navigation";
import { getOrderDetail } from "@/actions/order";
import { getCurrentCustomer } from "@/lib/session";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { PrintButton } from "@/components/pesanan/print-button";
import { BackButton } from "@/components/shared/back-button";

export const metadata = {
  title: "Struk Pembelian - DK Catering",
};

export default async function StrukPage({
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

  const orderDate = formatTanggalIndonesia(new Date(order.createdAt));

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
      <div className="print:hidden">
        <BackButton label="Kembali ke Status Pesanan" fallbackUrl={`/pesanan/${order.orderNumber}`} />
      </div>

      {/* STRUK PEMBELIAN */}
      <div className="bg-white rounded-card p-5 sm:p-7 border border-charcoal-200/80 shadow-card space-y-5 print:shadow-none print:border-none print:p-0">
        {/* Header Struk */}
        <div className="text-center pb-4 border-b border-dashed border-charcoal-300 space-y-1">
          <div className="w-10 h-10 rounded-full bg-charcoal text-accent font-black text-xl mx-auto flex items-center justify-center">
            DK
          </div>
          <h1 className="text-2xl font-black text-charcoal">DK CATERING</h1>
          <p className="text-xs text-charcoal-500">
            Katering Masakan Harian Rumahan
          </p>
          <p className="text-xs text-charcoal-400 font-mono mt-1">
            {orderDate}
          </p>
        </div>

        {/* Info Order */}
        <div className="text-xs space-y-1.5 pb-3 border-b border-dashed border-charcoal-300 font-mono">
          <div className="flex justify-between">
            <span className="text-charcoal-500">No. Pesanan:</span>
            <span className="font-bold text-charcoal">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">ID Pelanggan:</span>
            <span className="font-bold text-charcoal">{order.customerCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Nama:</span>
            <span className="font-bold text-charcoal">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Tujuan:</span>
            <span className="font-bold text-charcoal text-right">{order.maskedAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Pembayaran:</span>
            <span className="font-bold text-charcoal uppercase">Tunai ke Kurir (Cash)</span>
          </div>
          {order.note && (
            <div className="flex justify-between">
              <span className="text-charcoal-500">Catatan:</span>
              <span className="font-bold text-charcoal text-right">{order.note}</span>
            </div>
          )}
        </div>

        {/* Daftar Item */}
        <div className="space-y-3 pb-4 border-b border-dashed border-charcoal-300">
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
            Daftar Masakan
          </p>
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="text-sm flex justify-between items-start">
                <div>
                  <p className="font-bold text-charcoal leading-snug">{it.menuName}</p>
                  <p className="text-xs text-charcoal-500">
                    {formatRupiah(it.price)} x {it.quantity}
                  </p>
                </div>
                <p className="font-bold text-charcoal">{formatRupiah(it.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rincian Total */}
        <div className="space-y-1.5 text-sm pb-4 border-b border-charcoal-900 font-mono">
          <div className="flex justify-between text-charcoal-600">
            <span>Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Ongkir</span>
            <span>{formatRupiah(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-charcoal pt-2">
            <span>TOTAL TAGIHAN</span>
            <span className="text-lg">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Catatan Bawah Struk */}
        <div className="text-center text-xs text-charcoal-500 space-y-1 pt-2">
          <p className="font-semibold text-charcoal">
            Terima kasih telah berlangganan DK Catering!
          </p>
          <p>Simpan struk ini sebagai bukti pemesanan makanan Anda.</p>
        </div>

        {/* Tombol Cetak / Simpan */}
        <div className="pt-2 print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
