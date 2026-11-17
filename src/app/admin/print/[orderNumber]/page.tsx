import { createAdminClient } from "@/lib/supabase/admin";
import { formatTanggalIndonesia, formatRupiah } from "@/lib/utils";
import { generateOrderReceiptEscpos, createRawbtUrl } from "@/lib/escpos";
import { PrintReceiptClient } from "@/components/admin/print-receipt-client";

export default async function AdminPrintOrderPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const adminClient = createAdminClient();

  const { data: order } = await adminClient
    .from("orders")
    .select(`
      id,
      order_number,
      delivery_fee,
      subtotal,
      total,
      order_status,
      payment_method,
      payment_status,
      note,
      print_count,
      created_at,
      address_snapshot,
      customers (
        customer_code,
        name,
        wa_number
      ),
      order_items (
        menu_name_snapshot,
        price_snapshot,
        quantity,
        note
      )
    `)
    .eq("order_number", params.orderNumber)
    .single();

  if (!order) {
    return (
      <div className="p-8 text-center text-charcoal font-bold">
        Pesanan tidak ditemukan.
      </div>
    );
  }

  const snap = (order.address_snapshot || {}) as {
    full_address?: string;
    street?: string;
    houseNumber?: string;
    house_number?: string;
    kecamatan?: string;
    city?: string;
  };
  const fullAddress =
    snap.full_address ||
    `${snap.street || ""} No. ${snap.houseNumber || snap.house_number || ""}, Kec. ${snap.kecamatan || ""}, ${snap.city || ""}`;

  const c = order.customers as unknown as {
    customer_code: string;
    name: string;
    wa_number: string;
  } | null;
  const orderDate = formatTanggalIndonesia(new Date(order.created_at));

  const items = (((order.order_items || []) as unknown) as Array<{
    menu_name_snapshot: string;
    price_snapshot: number;
    quantity: number;
    note: string | null;
  }>).map((it) => ({
    name: it.menu_name_snapshot,
    quantity: it.quantity,
    price: it.price_snapshot,
    subtotal: it.price_snapshot * it.quantity,
    note: it.note,
  }));

  const receiptData = {
    storeName: "DK Catering",
    orderNumber: order.order_number,
    customerCode: c?.customer_code || "DK-xxxx",
    customerName: c?.name || "Pelanggan",
    waNumber: c?.wa_number || "",
    address: fullAddress,
    orderDate,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    note: order.note,
    items,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    total: order.total,
  };

  const escposText = generateOrderReceiptEscpos(receiptData);
  const rawbtUrl = createRawbtUrl(escposText);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <PrintReceiptClient
        orderId={order.id}
        orderNumber={order.order_number}
        printCount={order.print_count || 0}
        rawbtUrl={rawbtUrl}
      />

      {/* Tampilan Struk Kertas 58mm (Lebar ±48-58mm / 220px) */}
      <div
        id="thermal-receipt"
        className="w-[260px] bg-white p-3 font-mono text-[11px] leading-tight text-black shadow-md print:shadow-none print:w-[58mm] print:p-0 my-4 border border-gray-300 print:border-none"
      >
        <div className="text-center pb-2 border-b border-dashed border-black">
          <p className="font-bold text-sm tracking-wider">DK CATERING</p>
          <p className="text-[10px]">Katering Masakan Harian</p>
          <p className="text-[10px] mt-1">{orderDate}</p>
        </div>

        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span>ID Cust:</span>
            <span>{c?.customer_code}</span>
          </div>
          <div className="flex justify-between">
            <span>Nama:</span>
            <span className="font-bold">{c?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>WA:</span>
            <span>+{c?.wa_number}</span>
          </div>
          <div className="pt-1">
            <span className="font-bold block">Alamat Kirim:</span>
            <p className="text-[10px] break-words">{fullAddress}</p>
          </div>
        </div>

        <div className="py-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold text-[10px]">
            <span>MENU</span>
            <span>TOTAL</span>
          </div>
          {items.map((it, idx) => (
            <div key={idx}>
              <div className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span>{formatRupiah(it.subtotal)}</span>
              </div>
              {it.note && (
                <span className="text-[9px] text-gray-700 italic block pl-2">
                  * {it.note}
                </span>
              )}
            </div>
          ))}
        </div>

        {order.note && (
          <div className="py-1 border-b border-dashed border-black text-[10px]">
            <span className="font-bold">Catatan Dapur:</span>
            <p className="italic">{order.note}</p>
          </div>
        )}

        <div className="py-2 border-b border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkir:</span>
            <span>{formatRupiah(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs pt-1">
            <span>TOTAL:</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
        </div>

        <div className="py-2 border-b border-dashed border-black text-[10px]">
          <div className="flex justify-between">
            <span>Bayar:</span>
            <span className="font-bold uppercase">{order.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-bold uppercase">{order.payment_status}</span>
          </div>
        </div>

        <div className="text-center pt-2 text-[10px]">
          <p className="font-bold">Terima Kasih!</p>
          <p>Selamat Menikmati</p>
        </div>
      </div>
    </div>
  );
}
