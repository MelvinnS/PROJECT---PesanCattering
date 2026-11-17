import { Header } from "@/components/home/header";
import { MenuItemData } from "@/components/home/menu-card";
import { MenuSection } from "@/components/home/menu-section";
import { FloatingCart } from "@/components/home/floating-cart";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/session";
import { AlertCircle } from "lucide-react";

export const revalidate = 0; // Dynamic fetch agar data selalu update

// Fallback data simulasi jika Supabase belum terhubung
const FALLBACK_MENUS: MenuItemData[] = [
  {
    dailyMenuId: "dm-01",
    menuId: "m-01",
    name: "Ayam Goreng Lengkuas",
    description: "Ayam goreng bumbu rempah lengkuas gurih dan renyah, disajikan dengan sambal terasi matang.",
    price: 28000,
    photoUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    quota: 30,
    sold: 8,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-02",
    menuId: "m-02",
    name: "Rendang Sapi Empuk",
    description: "Daging sapi pilihan dimasak perlahan dengan santan dan rempah khas Padang, tekstur empuk ramah lansia.",
    price: 35000,
    photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    quota: 25,
    sold: 12,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-03",
    menuId: "m-03",
    name: "Sayur Asem Jakarta",
    description: "Kuah asam segar kaya rasa dengan kacang tanah, jagung manis, labu siam, dan melinjo.",
    price: 12000,
    photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 5,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-04",
    menuId: "m-04",
    name: "Ikan Gurame Bakar Madu",
    description: "Gurame segar bakar dengan olesan kecap madu gurih manis tidak pedas.",
    price: 32000,
    photoUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    quota: 15,
    sold: 15, // Habis
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-05",
    menuId: "m-05",
    name: "Sop Buntut Gurih",
    description: "Buntut sapi empuk dengan kaldu bening gurih, wortel, dan kentang lembut.",
    price: 35000,
    photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 9,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-06",
    menuId: "m-06",
    name: "Tumis Buncis Jagung Manis",
    description: "Sayur buncis muda dan jagung manis ditumis bawang putih wangi.",
    price: 10000,
    photoUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    quota: 25,
    sold: 4,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-07",
    menuId: "m-07",
    name: "Empal Gepuk Suwir",
    description: "Daging sapi manis gurih yang dipukul lembut dan disuwir mudah dikunyah.",
    price: 30000,
    photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 2,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-08",
    menuId: "m-08",
    name: "Pepes Tahu Jamur Kemangi",
    description: "Tahu sutra kukus daun pisang dengan jamur tiram dan aroma kemangi segar.",
    price: 12000,
    photoUrl: "https://images.unsplash.com/photo-1505253758473-96b3d5ebcd44?auto=format&fit=crop&w=600&q=80",
    quota: 30,
    sold: 6,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-09",
    menuId: "m-09",
    name: "Capcay Kuah Kental",
    description: "Aneka sayuran segar (kembang kol, wortel, brokoli, sawi) dengan kuah kaldu ayam gurih.",
    price: 16000,
    photoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 7,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-10",
    menuId: "m-10",
    name: "Telur Balado Padang",
    description: "Dua butir telur rebus goreng dengan sambal balado tomat gurih manis pedas ringan.",
    price: 14000,
    photoUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    quota: 25,
    sold: 10,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-11",
    menuId: "m-11",
    name: "Sayur Lodeh Labu Siam",
    description: "Sayur labu siam dan tahu tempe kuah santan gurih bumbu desa.",
    price: 12000,
    photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 3,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-12",
    menuId: "m-12",
    name: "Rawon Daging Sapi",
    description: "Kuah rawon kluwek hitam khas Jawa Timur dengan daging sapi empuk dan sambal terasi.",
    price: 32000,
    photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    quota: 25,
    sold: 11,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-13",
    menuId: "m-13",
    name: "Perkedel Kentang Daging (3 pcs)",
    description: "Kentang tumbuk lembut dicampur daging cincang dan daun bawang.",
    price: 15000,
    photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    quota: 30,
    sold: 14,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-14",
    menuId: "m-14",
    name: "Opor Ayam Kampung",
    description: "Potongan ayam kampung empuk kuah santan kuning wangi serai dan daun jeruk.",
    price: 30000,
    photoUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 6,
    isAvailable: true,
  },
  {
    dailyMenuId: "dm-15",
    menuId: "m-15",
    name: "Sambal Goreng Kentang Ati",
    description: "Potongan dadu kentang dan ati sapi dimasak bumbu merah gurih manis.",
    price: 22000,
    photoUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    quota: 20,
    sold: 20,
    isAvailable: false, // Tidak tersedia
  },
];

async function getDailyMenus(): Promise<{
  menus: MenuItemData[];
  isFromDb: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    // Ambil daily_menus hari ini beserta relasi master menus
    const { data, error } = await supabase
      .from("daily_menus")
      .select(`
        id,
        menu_id,
        quota,
        sold,
        is_available,
        menus:menu_id (
          name,
          description,
          price,
          photo_url
        )
      `)
      .eq("menu_date", today);

    if (error || !data || data.length === 0) {
      // Fallback data simulasi hanya aktif jika NODE_ENV=development DAN NEXT_PUBLIC_USE_MOCK_DATA=true
      const allowMock =
        process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

      if (allowMock) {
        return { menus: FALLBACK_MENUS, isFromDb: false };
      }
      return { menus: [], isFromDb: true };
    }

    const mappedMenus: MenuItemData[] = (
      data as unknown as Array<{
        id: string;
        menu_id: string;
        quota: number;
        sold: number;
        is_available: boolean;
        menus: {
          name: string;
          description: string | null;
          price: number;
          photo_url: string | null;
        } | null;
      }>
    ).map((item) => ({
      dailyMenuId: item.id,
      menuId: item.menu_id,
      name: item.menus?.name || "Menu Catering",
      description: item.menus?.description || null,
      price: item.menus?.price || 0,
      photoUrl: item.menus?.photo_url || null,
      quota: item.quota,
      sold: item.sold,
      isAvailable: item.is_available,
    }));

    return { menus: mappedMenus, isFromDb: true };
  } catch {
    const allowMock =
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    if (allowMock) {
      return {
        menus: FALLBACK_MENUS,
        isFromDb: false,
        error: "Mode simulasi aktif.",
      };
    }

    return {
      menus: [],
      isFromDb: true,
      error: "Gagal memuat menu hari ini. Silakan coba kembali nanti.",
    };
  }
}

export default async function HomePage() {
  const [{ menus, isFromDb }, currentCustomer] = await Promise.all([
    getDailyMenus(),
    getCurrentCustomer(),
  ]);

  return (
    <div className="flex-1 flex flex-col pb-36 bg-[#F8F9FA]">
      {/* 1. Header dengan status login aktual */}
      <Header isLoggedIn={!!currentCustomer} />

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 space-y-6">
        {/* Judul Menu Hari Ini */}
        <section className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-charcoal tracking-tight leading-tight">
            Menu Hari Ini
          </h1>
          <p className="text-charcoal-500 text-xs sm:text-base">
            Masakan rumahan segar dan higienis siap diantar ke rumah Anda.
          </p>

          {!isFromDb && (
            <div className="p-3 bg-amber-500 text-charcoal font-black rounded-2xl border border-amber-600 text-xs sm:text-sm flex items-center gap-2 mt-2 shadow-xs max-w-xl">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>
                MODE SIMULASI (Data lokal aktif untuk pengujian)
              </span>
            </div>
          )}
        </section>

        {/* 2. Daftar Menu & Fitur Pencarian */}
        {menus.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-3xl bg-white border border-charcoal-100 shadow-sm max-w-xl mx-auto">
            <p className="text-lg sm:text-xl font-bold text-charcoal mb-1">
              Menu hari ini belum tersedia
            </p>
            <p className="text-charcoal-500 text-xs sm:text-sm">
              Silakan cek kembali beberapa saat lagi atau hubungi kami lewat WhatsApp.
            </p>
          </div>
        ) : (
          <MenuSection initialMenus={menus} />
        )}

        {/* 3. Tombol Bantuan via WhatsApp */}
        <section className="pt-4 pb-2">
          <div className="bg-emerald-50/80 rounded-3xl p-5 sm:p-6 border border-emerald-100 text-center space-y-2.5 max-w-2xl mx-auto shadow-sm">
            <h4 className="font-bold text-charcoal text-base sm:text-lg">
              Butuh bantuan atau pertanyaan?
            </h4>
            <p className="text-charcoal-600 text-xs sm:text-sm">
              Admin kami siap melayani pesanan Anda setiap hari.
            </p>
            <div className="pt-1 flex justify-center">
              <WhatsAppButton />
            </div>
          </div>
        </section>
      </main>

      {/* 4. Keranjang Mengambang (Sticky Bottom) */}
      <FloatingCart />
    </div>
  );
}
