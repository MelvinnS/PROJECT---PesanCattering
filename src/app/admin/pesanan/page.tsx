"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAdminOrders,
  updateOrderStatus,
  markOrderPaid,
  cancelOrderAction,
  batchUpdateOrderStatus,
  recordOrderPrint,
  AdminOrderDetail,
} from "@/actions/admin-orders";
import { formatRupiah } from "@/lib/utils";
import { generateOrderReceiptEscpos, createRawbtUrl } from "@/lib/escpos";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Printer,
  Smartphone,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AdminPesananPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Aksi Massal
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Expanded card untuk detail di HP/Desktop
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Feedback & Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await getAdminOrders({
      date: filterDate,
      orderStatus: filterStatus,
      paymentStatus: filterPayment,
      searchQuery,
    });
    setOrders(data);
    setLoading(false);
  }, [filterDate, filterStatus, filterPayment, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handler Ubah Status
  const handleStatusChange = async (
    orderId: string,
    newStatus: "baru" | "dimasak" | "dikirim" | "selesai"
  ) => {
    setErrorMsg(null);
    const res = await updateOrderStatus(orderId, newStatus);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal mengubah status.");
      return;
    }
    loadOrders();
  };

  // Handler Tandai Lunas
  const handleMarkPaid = async (orderId: string) => {
    setErrorMsg(null);
    const res = await markOrderPaid(orderId);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal menandai lunas.");
      return;
    }
    setSuccessMsg("Pesanan berhasil ditandai Lunas.");
    loadOrders();
  };

  // Handler Batalkan Pesanan (Kembalikan Kuota)
  const handleCancelOrder = async (order: AdminOrderDetail) => {
    if (
      !confirm(
        `Batalkan pesanan ${order.orderNumber}? Kuota porsi ${order.items
          .map((i) => i.quantity)
          .reduce((a, b) => a + b, 0)} porsi akan dikembalikan ke dapur.`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    const res = await cancelOrderAction(order.id);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal membatalkan pesanan.");
      return;
    }
    setSuccessMsg(`Pesanan ${order.orderNumber} berhasil dibatalkan.`);
    loadOrders();
  };

  // Handler Aksi Massal
  const handleBatchStatus = async (status: "dimasak" | "dikirim") => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Ubah ${selectedOrderIds.length} pesanan terpilih menjadi "${status.toUpperCase()}"?`)) {
      return;
    }

    const res = await batchUpdateOrderStatus(selectedOrderIds, status);
    if (res.success) {
      setSelectedOrderIds([]);
      setSuccessMsg(`Berhasil memperbarui ${selectedOrderIds.length} pesanan.`);
      loadOrders();
    }
  };

  // Handler Cetak RawBT per Pesanan
  const handlePrintRawbt = async (order: AdminOrderDetail) => {
    if (order.printCount > 0) {
      if (!confirm(`Pesanan ini sudah pernah dicetak (${order.printCount}x). Cetak ulang?`)) {
        return;
      }
    }

    await recordOrderPrint(order.id);

    const escpos = generateOrderReceiptEscpos({
      storeName: "DK Catering",
      orderNumber: order.orderNumber,
      customerCode: order.customerCode,
      customerName: order.customerName,
      waNumber: order.customerWa,
      address: order.fullAddress,
      orderDate: new Date(order.createdAt).toLocaleString("id-ID"),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      note: order.note,
      items: order.items.map((i) => ({
        name: i.menuName,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
        note: i.note,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
    });

    window.location.href = createRawbtUrl(escpos);
    loadOrders();
  };

  // Handler Cetak Semua Pesanan Hari Ini secara Bertahap
  const handlePrintAllOrders = async () => {
    if (orders.length === 0) return;
    if (
      !confirm(
        `Cetak ${orders.length} struk pesanan hari ini secara berurutan ke RawBT?`
      )
    ) {
      return;
    }

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      await recordOrderPrint(order.id);

      const escpos = generateOrderReceiptEscpos({
        storeName: "DK Catering",
        orderNumber: order.orderNumber,
        customerCode: order.customerCode,
        customerName: order.customerName,
        waNumber: order.customerWa,
        address: order.fullAddress,
        orderDate: new Date(order.createdAt).toLocaleString("id-ID"),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        note: order.note,
        items: order.items.map((it) => ({
          name: it.menuName,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          note: it.note,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
      });

      window.location.href = createRawbtUrl(escpos);

      // Jeda 1 detik antar cetak agar RawBT dapat menangani antrean
      await new Promise((r) => setTimeout(r, 1200));
    }

    loadOrders();
  };

  // Toggle Checkbox Seleksi Massal
  const handleToggleSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & AKSI CETAK SEMUA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Manajemen Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Kelola proses masak, pengiriman, pembayaran, dan cetak struk pelanggan
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrintAllOrders}
            disabled={orders.length === 0}
            className="text-xs min-h-[42px] px-4 font-bold"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Cetak Semua ({orders.length})</span>
          </Button>
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

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-3xl border border-charcoal-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Filter Tanggal */}
          <div>
            <label className="text-[11px] font-bold text-charcoal-500 block mb-1">
              Tanggal Pesanan
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-xs font-bold bg-surface-subtle"
            />
          </div>

          {/* Filter Status Masak */}
          <div>
            <label className="text-[11px] font-bold text-charcoal-500 block mb-1">
              Status Pesanan
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-xs font-semibold bg-surface-subtle"
            >
              <option value="all">Semua Status</option>
              <option value="baru">Baru</option>
              <option value="dimasak">Dimasak</option>
              <option value="dikirim">Dikirim</option>
              <option value="selesai">Selesai</option>
              <option value="batal">Batal</option>
            </select>
          </div>

          {/* Filter Status Bayar */}
          <div>
            <label className="text-[11px] font-bold text-charcoal-500 block mb-1">
              Status Pembayaran
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-charcoal-200 text-xs font-semibold bg-surface-subtle"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="belum_bayar">Belum Bayar</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          {/* Pencarian */}
          <div>
            <label className="text-[11px] font-bold text-charcoal-500 block mb-1">
              Cari Pesanan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="No Pesanan / Nama / No WA"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-charcoal-200 text-xs font-semibold"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* AKSI MASSAL BAR (JIKA ADA YANG DICENTANG) */}
        {selectedOrderIds.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-amber-900">
              {selectedOrderIds.length} pesanan terpilih
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => handleBatchStatus("dimasak")}
                className="min-h-[36px] text-xs px-3"
              >
                Tandai Dimasak
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => handleBatchStatus("dikirim")}
                className="min-h-[36px] text-xs px-3 font-bold"
              >
                Tandai Dikirim
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* DAFTAR KARTU PESANAN */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl text-charcoal-400 text-sm">
          Memuat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-charcoal-100 shadow-sm space-y-2">
          <Filter className="w-10 h-10 text-charcoal-300 mx-auto" />
          <p className="font-bold text-charcoal">Tidak ada pesanan yang sesuai.</p>
          <p className="text-xs text-charcoal-400">
            Ubah filter tanggal atau status di atas untuk melihat pesanan lain.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-charcoal-500">
            <input
              type="checkbox"
              checked={selectedOrderIds.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-accent"
            />
            <span>Pilih Semua Pesanan ({orders.length})</span>
          </div>

          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const isSelected = selectedOrderIds.includes(order.id);
            const mapsUrl =
              order.latitude && order.longitude
                ? `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    order.fullAddress
                  )}`;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${
                  order.orderStatus === "batal"
                    ? "border-gray-200 bg-gray-50/70 opacity-60"
                    : isSelected
                    ? "border-charcoal ring-1 ring-charcoal"
                    : "border-charcoal-100"
                }`}
              >
                {/* HEADER KARTU PESANAN */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(order.id)}
                      className="w-4 h-4 rounded text-accent mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-accent-hover tracking-tight">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-charcoal-400">
                          ({order.customerCode})
                        </span>
                        {order.printCount > 0 && (
                          <span className="text-[10px] font-bold bg-charcoal-100 text-charcoal px-2 py-0.5 rounded-full">
                            Dicetak {order.printCount}x
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-charcoal text-base mt-0.5">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB &bull; {order.items.reduce((a, b) => a + b.quantity, 0)} porsi
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <span className="text-base sm:text-lg font-black text-charcoal block">
                      {formatRupiah(order.total)}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          order.paymentStatus === "lunas"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal uppercase">
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ALAMAT LENGKAP & LINK PETA + WA */}
                <div className="mt-3 pt-3 border-t border-charcoal-100 text-xs space-y-1.5">
                  <div className="flex items-start gap-1.5 text-charcoal-700">
                    <MapPin className="w-4 h-4 text-accent-hover shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">
                      <b>Alamat Lengkap:</b> {order.fullAddress}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={`https://wa.me/${order.customerWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Hubungi WA (+{order.customerWa})</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Lihat di Peta</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="text-charcoal-500 hover:text-charcoal font-bold flex items-center gap-1 ml-auto"
                    >
                      <span>{isExpanded ? "Tutup Rincian" : "Lihat Rincian Item"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* DETAIL EXPANDED: ITEM & CATATAN */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-charcoal-100 text-xs space-y-2 bg-surface-subtle p-3 rounded-2xl animate-in fade-in">
                    <p className="font-bold text-charcoal">Rincian Masakan:</p>
                    <div className="space-y-1 pl-2">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-charcoal">
                              {it.quantity}x {it.menuName}
                            </span>
                            {it.note && (
                              <p className="text-[11px] text-charcoal-500 italic">
                                * {it.note}
                              </p>
                            )}
                          </div>
                          <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <div className="pt-2 border-t border-charcoal-200/60">
                        <span className="font-bold text-charcoal">Catatan Dapur:</span>
                        <p className="text-charcoal-600 italic">{order.note}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* BARIS TOMBOL STATUS & CETAK */}
                <div className="mt-3 pt-3 border-t border-charcoal-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Pipeline */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {order.orderStatus === "baru" && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleStatusChange(order.id, "dimasak")}
                        className="text-xs min-h-[36px] px-3 font-bold"
                      >
                        Mulai Masak
                      </Button>
                    )}

                    {order.orderStatus === "dimasak" && (
                      <Button
                        type="button"
                        variant="accent"
                        onClick={() => handleStatusChange(order.id, "dikirim")}
                        className="text-xs min-h-[36px] px-3 font-bold"
                      >
                        Kirim Kurir
                      </Button>
                    )}

                    {order.orderStatus === "dikirim" && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleStatusChange(order.id, "selesai")}
                        className="text-xs min-h-[36px] px-3 font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Selesai</span>
                      </Button>
                    )}

                    {order.paymentStatus === "belum_bayar" && order.orderStatus !== "batal" && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleMarkPaid(order.id)}
                        className="text-xs min-h-[36px] px-3 font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        Tandai Lunas
                      </Button>
                    )}

                    {order.orderStatus !== "batal" && order.orderStatus !== "selesai" && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleCancelOrder(order)}
                        className="text-xs min-h-[36px] px-2.5 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Batalkan</span>
                      </Button>
                    )}
                  </div>

                  {/* Tombol Cetak Struk (RawBT + Browser 58mm) */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handlePrintRawbt(order)}
                      className="text-xs min-h-[36px] px-3 font-bold flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cetak RawBT</span>
                    </Button>

                    <Link href={`/admin/print/${order.orderNumber}`} target="_blank">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs min-h-[36px] px-2.5 font-bold text-charcoal"
                        title="Buka Struk HTML 58mm"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        <span>Struk HTML</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
