export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          customer_code: string;
          name: string;
          wa_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_code?: string;
          name: string;
          wa_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_code?: string;
          name?: string;
          wa_number?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          street: string | null;
          house_number: string | null;
          rt_rw: string | null;
          kelurahan: string | null;
          kecamatan: string | null;
          city: string | null;
          detail_note: string | null;
          full_address: string;
          latitude: number | null;
          longitude: number | null;
          distance_km: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label?: string;
          street?: string | null;
          house_number?: string | null;
          rt_rw?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          city?: string | null;
          detail_note?: string | null;
          full_address: string;
          latitude?: number | null;
          longitude?: number | null;
          distance_km?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          label?: string;
          street?: string | null;
          house_number?: string | null;
          rt_rw?: string | null;
          kelurahan?: string | null;
          kecamatan?: string | null;
          city?: string | null;
          detail_note?: string | null;
          full_address?: string;
          latitude?: number | null;
          longitude?: number | null;
          distance_km?: number | null;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          customer_id: string;
          token_hash: string;
          device_info: string | null;
          created_at: string;
          last_used_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          token_hash: string;
          device_info?: string | null;
          created_at?: string;
          last_used_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          token_hash?: string;
          device_info?: string | null;
          last_used_at?: string;
          expires_at?: string;
        };
      };
      menus: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      daily_menus: {
        Row: {
          id: string;
          menu_date: string;
          menu_id: string;
          quota: number;
          sold: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          address_snapshot: Json;
          delivery_fee: number;
          subtotal: number;
          total: number;
          order_status: "baru" | "dimasak" | "dikirim" | "selesai" | "batal";
          payment_method: "bca_va" | "qris" | "cash";
          payment_status: "belum_bayar" | "lunas" | "gagal" | "kedaluwarsa";
          note: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_id: string | null;
          menu_name_snapshot: string;
          price_snapshot: number;
          quantity: number;
          note: string | null;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: string;
          gateway_reference: string | null;
          status: string;
          paid_at: string | null;
          raw_payload: Json | null;
          created_at: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
        };
      };
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
      };
    };
    Functions: {
      create_order: {
        Args: {
          p_customer_id: string;
          p_address_id: string;
          p_payment_method: string;
          p_note: string | null;
          p_items: Json;
        };
        Returns: Json;
      };
    };
  };
}

export type Menu = Database["public"]["Tables"]["menus"]["Row"];
export type DailyMenu = Database["public"]["Tables"]["daily_menus"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export interface MaskedAddress {
  id: string;
  label: string;
  maskedAddress: string;
  isDefault: boolean;
}

export interface CustomerSessionData {
  id: string;
  customerCode: string;
  name: string;
  waNumber: string;
}
