-- =========================================================================
-- MIGRATION 002: Customer Auth, Sessions, Addresses Detail, & Atomic Order Function
-- =========================================================================

-- 1. TABEL SESSIONS (Token Hash Cookie untuk Customer)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 (64 hex characters)
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON sessions(customer_id);

-- 2. MODIFIKASI TABEL ADDRESSES
-- Menambahkan kolom terperinci untuk privasi dan masking
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS street VARCHAR(150),
  ADD COLUMN IF NOT EXISTS house_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS rt_rw VARCHAR(30),
  ADD COLUMN IF NOT EXISTS kelurahan VARCHAR(100),
  ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS detail_note TEXT;

-- Pastikan hanya satu alamat yang boleh is_default = true per customer
CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_single_default
  ON addresses(customer_id)
  WHERE (is_default = true);

-- Update dummy addresses yang sudah ada jika belum memiliki nilai kolom baru
UPDATE addresses
SET 
  street = 'Jl. Melati',
  house_number = '14',
  kecamatan = 'Lowokwaru',
  city = 'Malang'
WHERE street IS NULL;

-- 3. PERKETAT ROW LEVEL SECURITY (RLS)
-- Customer data (customers, addresses, orders, order_items, payments, sessions)
-- TIDAK BOLEH diakses oleh role 'anon' atau 'authenticated' secara langsung dari client.
-- Hanya backend / service_role yang memiliki akses (Service Role otomatis bypass RLS).
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select customers" ON customers;
DROP POLICY IF EXISTS "Public select addresses" ON addresses;
DROP POLICY IF EXISTS "Public select orders" ON orders;
DROP POLICY IF EXISTS "Public select order_items" ON order_items;
DROP POLICY IF EXISTS "Public select payments" ON payments;
DROP POLICY IF EXISTS "Public select sessions" ON sessions;

-- Jangan beri policy SELECT/INSERT/UPDATE/DELETE untuk role 'anon' atau 'authenticated'
-- pada tabel customers, addresses, orders, order_items, payments, dan sessions.

-- 4. FUNGSI SQL ATOMIK: create_order
-- Menjalankan transaksi pesanan aman dengan SELECT ... FOR UPDATE pada daily_menus
CREATE OR REPLACE FUNCTION create_order(
  p_customer_id UUID,
  p_address_id UUID,
  p_payment_method VARCHAR(20),
  p_note TEXT,
  p_items JSONB -- Array of { menu_id: UUID, quantity: INT, note?: TEXT }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Berjalan dengan hak akses pembuat (service/postgres)
AS $$
DECLARE
  v_address_row RECORD;
  v_address_snapshot JSONB;
  v_order_id UUID;
  v_order_number VARCHAR(30);
  v_item RECORD;
  v_daily_menu RECORD;
  v_menu RECORD;
  v_subtotal INT := 0;
  v_total INT := 0;
  v_delivery_fee INT := 0;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- A. Validasi keberadaan customer
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id) THEN
    RAISE EXCEPTION 'Pelanggan tidak ditemukan.';
  END IF;

  -- B. Ambil snapshot alamat
  SELECT * INTO v_address_row FROM addresses WHERE id = p_address_id AND customer_id = p_customer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alamat pengiriman tidak ditemukan.';
  END IF;

  v_address_snapshot := jsonb_build_object(
    'id', v_address_row.id,
    'label', v_address_row.label,
    'street', v_address_row.street,
    'house_number', v_address_row.house_number,
    'rt_rw', v_address_row.rt_rw,
    'kelurahan', v_address_row.kelurahan,
    'kecamatan', v_address_row.kecamatan,
    'city', v_address_row.city,
    'detail_note', v_address_row.detail_note,
    'full_address', v_address_row.full_address
  );

  -- C. Validasi isi keranjang pesanan
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang pesanan masih kosong.';
  END IF;

  -- D. Buat ID & nomor pesanan terlebih dahulu (menggunakan trigger generate_order_number bawaan)
  v_order_id := gen_random_uuid();
  
  -- Masukkan baris awal order (subtotal diupdate setelah looping)
  INSERT INTO orders (
    id,
    order_number,
    customer_id,
    address_snapshot,
    delivery_fee,
    subtotal,
    total,
    order_status,
    payment_method,
    payment_status,
    note
  ) VALUES (
    v_order_id,
    '', -- akan digenerate otomatis oleh trigger before insert
    p_customer_id,
    v_address_snapshot,
    v_delivery_fee,
    0,
    0,
    'baru',
    p_payment_method,
    'belum_bayar',
    p_note
  )
  RETURNING order_number INTO v_order_number;

  -- E. Iterasi p_items dan KUNCI baris daily_menus dengan FOR UPDATE
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_id UUID, quantity INT, note TEXT)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Jumlah pesanan tidak valid.';
    END IF;

    -- Ambil master menu untuk snapshot nama dan harga
    SELECT * INTO v_menu FROM menus WHERE id = v_item.menu_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu dengan ID % tidak ditemukan.', v_item.menu_id;
    END IF;

    -- KUNCI BARIS daily_menus secara atomik untuk mencegah race-condition kuota
    SELECT * INTO v_daily_menu
    FROM daily_menus
    WHERE menu_date = v_today AND menu_id = v_item.menu_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_daily_menu.is_available THEN
      RAISE EXCEPTION 'Maaf, menu "%" tidak tersedia hari ini.', v_menu.name;
    END IF;

    -- Periksa sisa kuota
    IF (v_daily_menu.quota - v_daily_menu.sold) < v_item.quantity THEN
      RAISE EXCEPTION 'Maaf, sisa porsi untuk "%" hanya tersisa % porsi.', 
        v_menu.name, GREATEST(0, (v_daily_menu.quota - v_daily_menu.sold));
    END IF;

    -- Tambah porsi yang terjual pada daily_menus
    UPDATE daily_menus
    SET sold = sold + v_item.quantity
    WHERE id = v_daily_menu.id;

    -- Masukkan ke order_items
    INSERT INTO order_items (
      order_id,
      menu_id,
      menu_name_snapshot,
      price_snapshot,
      quantity,
      note
    ) VALUES (
      v_order_id,
      v_item.menu_id,
      v_menu.name,
      v_menu.price,
      v_item.quantity,
      v_item.note
    );

    -- Akumulasi subtotal
    v_subtotal := v_subtotal + (v_menu.price * v_item.quantity);
  END LOOP;

  -- F. Update total pada tabel orders
  v_total := v_subtotal + v_delivery_fee;

  UPDATE orders
  SET subtotal = v_subtotal,
      total = v_total
  WHERE id = v_order_id;

  -- G. Kembalikan data dalam format JSON
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'total', v_total
  );
END;
$$;
