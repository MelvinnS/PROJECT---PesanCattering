-- =========================================================================
-- MIGRATION 003: Admin Features, Storage Bucket, Atomic Cancel Order, 
-- Rekap Masak View, Print Tracking, and Indexes
-- =========================================================================

-- 1. BUCKET STORAGE UNTUK FOTO MENU (menu-photos)
-- Buat bucket publik jika belum ada (ukuran maksimal 2MB, gambar saja)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-photos',
  'menu-photos',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Siapapun boleh melihat foto, tapi hanya Admin yang boleh Upload/Update/Delete
CREATE POLICY "Public Read Menu Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-photos');

CREATE POLICY "Admin Upload Menu Photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-photos' AND
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

CREATE POLICY "Admin Update Menu Photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-photos' AND
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

CREATE POLICY "Admin Delete Menu Photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-photos' AND
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

-- 2. KOLOM CETAK DI TABEL ORDERS
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_printed_at TIMESTAMPTZ;

-- 3. INDEX UNTUK PERFORMA QUERY ADMIN
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_daily_menus_lookup ON daily_menus(menu_date, is_available);

-- 4. FUNGSI ATOMIK: cancel_order
-- Membatalkan pesanan dan mengembalikan porsi sold pada daily_menus
CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_order_date DATE;
  v_daily_menu_id UUID;
BEGIN
  -- Ambil data pesanan
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
  END IF;

  IF v_order.order_status = 'batal' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan sudah berstatus batal.');
  END IF;

  IF v_order.order_status = 'selesai' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan yang sudah selesai tidak dapat dibatalkan.');
  END IF;

  -- Tanggal pesanan diambil dari created_at
  v_order_date := (v_order.created_at AT TIME ZONE 'Asia/Jakarta')::DATE;

  -- Kembalikan kuota sold di daily_menus untuk setiap item
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.menu_id IS NOT NULL THEN
      -- Cari baris daily_menus terkait pada tanggal pesanan tersebut
      SELECT id INTO v_daily_menu_id
      FROM daily_menus
      WHERE menu_date = v_order_date AND menu_id = v_item.menu_id
      FOR UPDATE;

      IF FOUND THEN
        UPDATE daily_menus
        SET sold = GREATEST(0, sold - v_item.quantity)
        WHERE id = v_daily_menu_id;
      END IF;
    END IF;
  END LOOP;

  -- Update status pesanan menjadi batal
  UPDATE orders
  SET order_status = 'batal',
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pesanan berhasil dibatalkan dan kuota porsi telah dikembalikan.',
    'order_id', p_order_id
  );
END;
$$;

-- 5. VIEW / FUNGSI REKAP MASAK
-- Menghitung total porsi per menu per tanggal khusus pesanan yang TIDAK batal
CREATE OR REPLACE FUNCTION get_cooking_recap(p_date DATE)
RETURNS TABLE (
  menu_id UUID,
  menu_name VARCHAR,
  total_portions BIGINT,
  notes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.menu_id,
    oi.menu_name_snapshot AS menu_name,
    SUM(oi.quantity)::BIGINT AS total_portions,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'order_number', o.order_number,
          'quantity', oi.quantity,
          'item_note', oi.note,
          'order_note', o.note
        )
      ) FILTER (WHERE (oi.note IS NOT NULL AND oi.note <> '') OR (o.note IS NOT NULL AND o.note <> '')),
      '[]'::jsonb
    ) AS notes
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE (o.created_at AT TIME ZONE 'Asia/Jakarta')::DATE = p_date
    AND o.order_status <> 'batal'
  GROUP BY oi.menu_id, oi.menu_name_snapshot
  ORDER BY total_portions DESC;
END;
$$;
