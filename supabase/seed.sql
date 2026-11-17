-- SEED DATA UNTUK DK CATERING

-- 1. Pengaturan Awal (Settings)
INSERT INTO settings (key, value, description) VALUES
  ('store_name', 'DK Catering', 'Nama usaha catering'),
  ('order_cutoff_time', '09:00', 'Batas akhir pemesanan harian (WIB)'),
  ('kitchen_lat', '-7.9666204', 'Latitude lokasi dapur (Malang/Jawa Timur)'),
  ('kitchen_lng', '112.6326321', 'Longitude lokasi dapur'),
  ('delivery_fee_per_km', '3000', 'Tarif ongkir per kilometer dalam Rupiah')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. 15 Master Menu Masakan Rumahan Indonesia
INSERT INTO menus (id, name, description, price, photo_url, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111101', 'Ayam Goreng Lengkuas', 'Ayam goreng bumbu rempah lengkuas gurih dan renyah, disajikan dengan sambal terasi matang.', 28000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111102', 'Rendang Sapi Empuk', 'Daging sapi pilihan dimasak perlahan dengan santan dan rempah khas Padang, tekstur empuk ramah lansia.', 35000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111103', 'Sayur Asem Jakarta', 'Kuah asam segar kaya rasa dengan kacang tanah, jagung manis, labu siam, dan melinjo.', 12000, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111104', 'Ikan Gurame Bakar Madu', 'Gurame segar bakar dengan olesan kecap madu gurih manis tidak pedas.', 32000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111105', 'Sop Buntut Gurih', 'Buntut sapi empuk dengan kaldu bening gurih, wortel, dan kentang lembut.', 35000, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111106', 'Tumis Buncis Jagung Manis', 'Sayur buncis muda dan jagung manis ditumis bawang putih wangi.', 10000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111107', 'Empal Gepuk Suwir', 'Daging sapi manis gurih yang dipukul lembut dan disuwir mudah dikunyah.', 30000, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111108', 'Pepes Tahu Jamur Kemangi', 'Tahu sutra kukus daun pisang dengan jamur tiram dan aroma kemangi segar.', 12000, 'https://images.unsplash.com/photo-1505253758473-96b3d5ebcd44?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111109', 'Capcay Kuah Kental', 'Aneka sayuran segar (kembang kol, wortel, brokoli, sawi) dengan kuah kaldu ayam gurih.', 16000, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111110', 'Telur Balado Padang', 'Dua butir telur rebus goreng dengan sambal balado tomat gurih manis pedas ringan.', 14000, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111111', 'Sayur Lodeh Labu Siam', 'Sayur labu siam dan tahu tempe kuah santan gurih bumbu desa.', 12000, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111112', 'Rawon Daging Sapi', 'Kuah rawon kluwek hitam khas Jawa Timur dengan daging sapi empuk dan sambal terasi.', 32000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111113', 'Perkedel Kentang Daging (3 pcs)', 'Kentang tumbuk lembut dicampur daging cincang dan daun bawang.', 15000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111114', 'Opor Ayam Kampung', 'Potongan ayam kampung empuk kuah santan kuning wangi serai dan daun jeruk.', 30000, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80', true),
  ('a1111111-1111-1111-1111-111111111115', 'Sambal Goreng Kentang Ati', 'Potongan dadu kentang dan ati sapi dimasak bumbu merah gurih manis.', 22000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  photo_url = EXCLUDED.photo_url,
  is_active = EXCLUDED.is_active;

-- 3. Menu Harian (Daily Menus) untuk Hari Ini (CURRENT_DATE)
INSERT INTO daily_menus (menu_date, menu_id, quota, sold, is_available) VALUES
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111101', 30, 8, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111102', 25, 12, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111103', 20, 5, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111104', 15, 15, true), -- habis (sold == quota)
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111105', 20, 9, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111106', 25, 4, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111107', 20, 2, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111108', 30, 6, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111109', 20, 7, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111110', 25, 10, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111111', 20, 3, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111112', 25, 11, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111113', 30, 14, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111114', 20, 6, true),
  (CURRENT_DATE, 'a1111111-1111-1111-1111-111111111115', 20, 20, false) -- dinonaktifkan / habis
ON CONFLICT (menu_date, menu_id) DO UPDATE SET
  quota = EXCLUDED.quota,
  sold = EXCLUDED.sold,
  is_available = EXCLUDED.is_available;

-- 4. 3 Pelanggan Dummy
INSERT INTO customers (id, customer_code, name, wa_number) VALUES
  ('c1111111-1111-1111-1111-111111111101', 'DK-0001', 'Ibu Ratna Susanti', '6281234567890'),
  ('c1111111-1111-1111-1111-111111111102', 'DK-0002', 'Bapak Bambang Wijaya', '6281398765432'),
  ('c1111111-1111-1111-1111-111111111103', 'DK-0003', 'Ibu Hj. Aminah', '6281987654321')
ON CONFLICT (wa_number) DO NOTHING;

-- Alamat Dummy
INSERT INTO addresses (customer_id, label, full_address, latitude, longitude, distance_km, is_default) VALUES
  ('c1111111-1111-1111-1111-111111111101', 'Rumah', 'Jl. Melati No. 14, Lowokwaru, Malang', -7.951234, 112.621234, 2.5, true),
  ('c1111111-1111-1111-1111-111111111102', 'Rumah', 'Jl. Cengger Ayam No. 8, Klojen, Malang', -7.945678, 112.634567, 3.2, true),
  ('c1111111-1111-1111-1111-111111111103', 'Rumah', 'Jl. Ijen No. 45, Oro-oro Dowo, Malang', -7.971234, 112.628901, 1.8, true)
ON CONFLICT DO NOTHING;
