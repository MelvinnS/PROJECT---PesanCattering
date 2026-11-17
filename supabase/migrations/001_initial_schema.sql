-- Skema Database DK Catering (Tahap 1)
-- Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL CUSTOMERS
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := 'DK-' || LPAD(nextval('customer_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  wa_number VARCHAR(20) UNIQUE NOT NULL, -- format: 62xxxxxxxxxx
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_generate_customer_code ON customers;
CREATE TRIGGER trigger_generate_customer_code
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION generate_customer_code();

CREATE INDEX IF NOT EXISTS idx_customers_wa_number ON customers (wa_number);

-- 2. TABEL ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'Rumah', -- Rumah/Kantor/dll
  full_address TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  distance_km NUMERIC(5, 2),
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses (customer_id);

-- 3. TABEL MENUS (Master Menu)
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABEL DAILY_MENUS (Jadwal Menu Harian)
CREATE TABLE IF NOT EXISTS daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date DATE NOT NULL,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  quota INTEGER NOT NULL DEFAULT 50 CHECK (quota >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_daily_menu UNIQUE (menu_date, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus (menu_date);

-- 5. TABEL ORDERS
-- Sequence order harian dihitung per hari: format DK-YYMMDD-001
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_prefix TEXT;
  daily_seq INT;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    today_prefix := 'DK-' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || '-';
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+$')::INT), 0) + 1
    INTO daily_seq
    FROM orders
    WHERE order_number LIKE today_prefix || '%';

    NEW.order_number := today_prefix || LPAD(daily_seq::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  address_snapshot JSONB NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  order_status VARCHAR(20) NOT NULL DEFAULT 'baru'
    CHECK (order_status IN ('baru', 'dimasak', 'dikirim', 'selesai', 'batal')),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('bca_va', 'qris', 'cash')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'belum_bayar'
    CHECK (payment_status IN ('belum_bayar', 'lunas', 'gagal', 'kedaluwarsa')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- 6. TABEL ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  menu_name_snapshot VARCHAR(150) NOT NULL,
  price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- 7. TABEL PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL,
  gateway_reference VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);

-- 8. TABEL SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. TABEL ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(150) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ROW LEVEL SECURITY (RLS) DASAR
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy membaca untuk public/anon (Menu dan Pengaturan umum)
CREATE POLICY "Public dapat membaca menus yang aktif"
ON menus FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Public dapat membaca menu harian"
ON daily_menus FOR SELECT
USING (is_available = TRUE);

CREATE POLICY "Public dapat membaca settings umum"
ON settings FOR SELECT
USING (true);

-- Policy Admin (akses penuh jika terdaftar di admins)
CREATE POLICY "Admin full access menus" ON menus FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access daily_menus" ON daily_menus FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access orders" ON orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access settings" ON settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access customers" ON customers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access addresses" ON addresses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
CREATE POLICY "Admin full access payments" ON payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
