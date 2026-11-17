"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminCustomers,
  getAdminCustomerDetail,
  AdminCustomerItem,
  AdminCustomerDetail,
} from "@/actions/admin-customers";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Users, Phone, MapPin, ShoppingBag, Eye, X } from "lucide-react";

export default function AdminPelangganPage() {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const data = await getAdminCustomers(searchQuery);
    setCustomers(data);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleOpenDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    const detail = await getAdminCustomerDetail(id);
    setCustomerDetail(detail);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Data Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Daftar pelanggan terdaftar, alamat lengkap, dan total transaksi
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Cari nama, kode DK, atau nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl border border-charcoal-200 text-xs font-semibold bg-white shadow-xs"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* DAFTAR PELANGGAN */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl text-charcoal-400 text-sm">
          Memuat daftar pelanggan...
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-charcoal-100 shadow-sm space-y-2">
          <Users className="w-10 h-10 text-charcoal-300 mx-auto" />
          <p className="font-bold text-charcoal">Tidak ditemukan pelanggan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-charcoal-100 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-accent-hover tracking-tight">
                    {c.customerCode}
                  </span>
                  <span className="text-[11px] font-bold text-charcoal-400">
                    {c.orderCount} pesanan
                  </span>
                </div>
                <h3 className="font-black text-base text-charcoal mt-1">
                  {c.name}
                </h3>
                <p className="text-xs font-semibold text-charcoal-500 mt-0.5">
                  +{c.waNumber}
                </p>

                <div className="mt-2.5 pt-2.5 border-t border-charcoal-100 text-xs text-charcoal-600 line-clamp-2">
                  <span className="font-bold">Alamat:</span> {c.fullAddress}
                </div>
              </div>

              <div className="pt-2 border-t border-charcoal-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-400 block font-bold uppercase">
                    Total Belanja
                  </span>
                  <span className="text-sm font-black text-charcoal">
                    {formatRupiah(c.totalSpent)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${c.waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    title="Kirim Pesan WA"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenDetail(c.id)}
                    className="text-xs min-h-[36px] px-2.5 font-bold text-charcoal"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>Detail</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL PELANGGAN LENGKAP */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-hover" />
                <h3 className="font-black text-lg text-charcoal">
                  Detail Profil Pelanggan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-full text-charcoal-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !customerDetail ? (
              <div className="py-8 text-center text-charcoal-400 text-sm">
                Memuat detail pelanggan...
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Ringkasan Akun */}
                <div className="p-3.5 rounded-2xl bg-surface-subtle border border-charcoal-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Kode Pelanggan:</span>
                    <span className="font-black text-charcoal">
                      {customerDetail.customerCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Nama:</span>
                    <span className="font-bold text-charcoal">
                      {customerDetail.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Nomor WhatsApp:</span>
                    <span className="font-bold text-charcoal">
                      +{customerDetail.waNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Total Transaksi:</span>
                    <span className="font-black text-charcoal">
                      {formatRupiah(customerDetail.totalSpent)} ({customerDetail.orderCount}x order)
                    </span>
                  </div>
                </div>

                {/* Daftar Alamat Lengkap */}
                <div className="space-y-2">
                  <span className="font-bold text-charcoal flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent-hover" />
                    <span>Daftar Alamat Lengkap</span>
                  </span>
                  <div className="space-y-2">
                    {customerDetail.addresses.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-charcoal-200 bg-white space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-charcoal uppercase">
                            {a.label}
                          </span>
                          {a.isDefault && (
                            <span className="text-[10px] bg-accent-light text-accent-hover font-bold px-1.5 rounded-full">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-700 leading-relaxed">
                          {a.fullAddress}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5 Pesanan Terakhir */}
                <div className="space-y-2">
                  <span className="font-bold text-charcoal flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-accent-hover" />
                    <span>Riwayat Pesanan Terbaru</span>
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customerDetail.recentOrders.map((o) => (
                      <div
                        key={o.id}
                        className="p-2.5 rounded-xl border border-charcoal-100 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-accent-hover block">
                            {o.orderNumber}
                          </span>
                          <span className="text-[10px] text-charcoal-400">
                            {formatTanggalIndonesia(new Date(o.createdAt))}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-charcoal block">
                            {formatRupiah(o.total)}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-800">
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
