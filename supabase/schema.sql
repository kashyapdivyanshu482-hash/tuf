-- ============================================
-- TUF CLOTHING - ONE-SHOT DIRECT CHECKOUT SCHEMA (V3)
-- Single `products` table includes:
-- - 5 image links per product
-- - size-wise price and stock columns
-- ============================================

-- 0) EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) CLEANUP
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS banners CASCADE;

-- 2) BANNERS
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_to TEXT DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) PRODUCTS
-- `price` is the default listing price (same as M size price).
-- `original_price` is crossed-out M size price.
-- `discount_percent` is whole-number discount for listing.
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  fabric TEXT NOT NULL,
  print_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('New Arrivals', 'Unisex', 'Winter', 'Summer', 'Gymwear')),

  -- 5 product images (required)
  image_url TEXT NOT NULL,   -- backward-compatible primary image
  image_url_1 TEXT NOT NULL,
  image_url_2 TEXT NOT NULL,
  image_url_3 TEXT NOT NULL,
  image_url_4 TEXT NOT NULL,
  image_url_5 TEXT NOT NULL,

  -- Listing level pricing
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(10,2) NOT NULL CHECK (original_price >= price),
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),

  -- Size-wise pricing
  size_xs_price NUMERIC(10,2) NOT NULL CHECK (size_xs_price > 0),
  size_s_price NUMERIC(10,2) NOT NULL CHECK (size_s_price > 0),
  size_m_price NUMERIC(10,2) NOT NULL CHECK (size_m_price > 0),
  size_l_price NUMERIC(10,2) NOT NULL CHECK (size_l_price > 0),
  size_xl_price NUMERIC(10,2) NOT NULL CHECK (size_xl_price > 0),
  size_xxl_price NUMERIC(10,2) NOT NULL CHECK (size_xxl_price > 0),

  -- Size-wise stock
  size_xs_stock INT NOT NULL DEFAULT 0 CHECK (size_xs_stock >= 0),
  size_s_stock INT NOT NULL DEFAULT 0 CHECK (size_s_stock >= 0),
  size_m_stock INT NOT NULL DEFAULT 0 CHECK (size_m_stock >= 0),
  size_l_stock INT NOT NULL DEFAULT 0 CHECK (size_l_stock >= 0),
  size_xl_stock INT NOT NULL DEFAULT 0 CHECK (size_xl_stock >= 0),
  size_xxl_stock INT NOT NULL DEFAULT 0 CHECK (size_xxl_stock >= 0),

  -- Total stock for quick listing/filtering
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (price = size_m_price)
);

CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_featured_idx ON products(is_featured);

-- 4) ORDERS (DIRECT CHECKOUT, NO AUTH REQUIRED)
-- Tax rule:
--   - Per item unit price <= 2500 => 5%
--   - Per item unit price  > 2500 => 18%
-- Shipping rule:
--   - 50 by default
--   - 0 when subtotal > 1000
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL CHECK (position('@' in customer_email) > 1),
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT FALSE CHECK (accepted_terms),
  accepted_privacy BOOLEAN NOT NULL DEFAULT FALSE CHECK (accepted_privacy),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC(10,2) NOT NULL CHECK (tax_amount >= 0),
  shipping_amount NUMERIC(10,2) NOT NULL CHECK (shipping_amount >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'PREPAID' CHECK (payment_method IN ('PREPAID', 'COD')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED')),
  pay_now_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (pay_now_amount >= 0),
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  amount_to_collect NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_to_collect >= 0),
  cod_advance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cod_advance_amount >= 0),
  cod_handling_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cod_handling_fee >= 0),
  cashfree_order_id TEXT,
  cashfree_payment_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX orders_email_idx ON orders(customer_email);
CREATE INDEX orders_payment_method_idx ON orders(payment_method);
CREATE INDEX orders_payment_status_idx ON orders(payment_status);

-- 5) ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_size TEXT NOT NULL CHECK (product_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  original_price NUMERIC(10,2) NOT NULL CHECK (original_price >= unit_price),
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
  tax_rate NUMERIC(5,4) NOT NULL CHECK (tax_rate IN (0.0500, 0.1800)),
  tax_amount NUMERIC(10,2) NOT NULL CHECK (tax_amount >= 0),
  line_subtotal NUMERIC(10,2) NOT NULL CHECK (line_subtotal >= 0),
  line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- 6) RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 7) POLICIES
-- Public read for storefront
CREATE POLICY public_read_banners ON banners FOR SELECT USING (TRUE);
CREATE POLICY public_read_products ON products FOR SELECT USING (TRUE);

-- Public insert for direct checkout
CREATE POLICY public_insert_orders
ON orders FOR INSERT
WITH CHECK (accepted_terms = TRUE AND accepted_privacy = TRUE);

CREATE POLICY public_insert_order_items
ON order_items FOR INSERT
WITH CHECK (TRUE);

-- 8) SEED PRODUCTS (INR, with 5 images + size-wise stock/price columns)
WITH base_products AS (
  SELECT *
  FROM (
    VALUES
      ('Heavyweight Boxy Tee', 'Premium 300GSM cotton tee in off-white.', '300GSM Premium Cotton', 'High-Density Puff Print', 'New Arrivals', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 2499::NUMERIC(10,2), 4999::NUMERIC(10,2), TRUE, 12, 18, 22, 20, 14, 10),
      ('Acid Wash Oversized Tee', 'Faded finish and dropped shoulder silhouette.', '280GSM Washed Cotton', 'Vintage Screen Print', 'New Arrivals', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c', 2199::NUMERIC(10,2), 4399::NUMERIC(10,2), FALSE, 11, 16, 20, 18, 13, 9),
      ('Utility Drop Shoulder Tee', 'Relaxed fit built for everyday movement.', 'Heavy Cotton Blend', 'Rubber Transfer', 'New Arrivals', 'https://images.unsplash.com/photo-1527719327859-c6ce80353573', 1999::NUMERIC(10,2), 3999::NUMERIC(10,2), FALSE, 13, 19, 24, 21, 15, 10),

      ('Technical Cargo Pants', 'Water-resistant fabric with 6-pocket design.', 'Nylon-Spandex Blend', 'Matte Transfer Logo', 'Unisex', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1', 3299::NUMERIC(10,2), 6599::NUMERIC(10,2), TRUE, 8, 12, 16, 15, 10, 7),
      ('Tapered Utility Joggers', 'Structured jogger with tactical pocketing.', 'Stretch Twill', 'Minimal Reflective Print', 'Unisex', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a', 2899::NUMERIC(10,2), 5799::NUMERIC(10,2), TRUE, 9, 13, 17, 16, 11, 8),
      ('All-Day Straight Fit Pants', 'Smart street fit for daily use.', 'Poly-Cotton Technical Weave', 'Embossed Branding', 'Unisex', 'https://images.unsplash.com/photo-1495385794356-15371f348c31', 2599::NUMERIC(10,2), 5199::NUMERIC(10,2), FALSE, 10, 14, 18, 17, 12, 8),

      ('Thermal Zip Hoodie', 'Insulated fleece with clean front structure.', 'Thermal Cotton Fleece', 'Raised Rubber Print', 'Winter', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f', 3499::NUMERIC(10,2), 6999::NUMERIC(10,2), TRUE, 7, 10, 14, 13, 9, 6),
      ('Heavy Sherpa Jacket', 'Warm lined jacket for cold weather layering.', 'Sherpa + Nylon Shell', 'Woven Patch Branding', 'Winter', 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb', 4599::NUMERIC(10,2), 9199::NUMERIC(10,2), TRUE, 5, 8, 10, 10, 7, 5),
      ('Winter Tech Sweatshirt', 'Dense knit with soft brushed interior.', 'Brushed Fleece', 'Silicone Chest Print', 'Winter', 'https://images.unsplash.com/photo-1516826957135-700dedea698c', 2799::NUMERIC(10,2), 5599::NUMERIC(10,2), FALSE, 8, 12, 15, 14, 10, 7),

      ('Air Mesh Performance Tee', 'Ultra-light tee with ventilation zones.', 'Mesh Poly-Cotton', 'Reflective Heat Print', 'Summer', 'https://images.unsplash.com/photo-1483985988355-763728e1935b', 1799::NUMERIC(10,2), 3599::NUMERIC(10,2), TRUE, 16, 22, 26, 24, 18, 12),
      ('Summer Utility Shorts', 'Quick-dry shorts with dual cargo pockets.', 'Quick-Dry Nylon', 'Contrast Transfer Print', 'Summer', 'https://images.unsplash.com/photo-1565693413579-8f2f3b0b9f5e', 1699::NUMERIC(10,2), 3399::NUMERIC(10,2), FALSE, 15, 21, 25, 23, 17, 12),
      ('Breeze Linen Shirt', 'Lightweight top with modern relaxed cut.', 'Linen-Cotton Blend', 'Minimal Ink Print', 'Summer', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e', 2099::NUMERIC(10,2), 4199::NUMERIC(10,2), FALSE, 13, 18, 22, 20, 15, 10),

      ('Performance Stringer', 'Breathable mesh for high-intensity training.', 'Breathable Mesh Poly-Cotton', 'Silicone Heat Print', 'Gymwear', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e', 1499::NUMERIC(10,2), 2999::NUMERIC(10,2), TRUE, 20, 28, 34, 30, 22, 16),
      ('Compression Training Tee', 'Sweat-wicking fit for intense sessions.', 'Elastane Technical Knit', 'Micro Transfer Branding', 'Gymwear', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438', 1999::NUMERIC(10,2), 3999::NUMERIC(10,2), TRUE, 18, 25, 30, 27, 20, 14),
      ('Training Flex Shorts', '4-way stretch shorts for gym and run.', 'Stretch Poly Blend', 'Reflective Side Print', 'Gymwear', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e', 1599::NUMERIC(10,2), 3199::NUMERIC(10,2), FALSE, 19, 26, 32, 29, 21, 15)
  ) AS t(
    name,
    description,
    fabric,
    print_type,
    category,
    primary_image,
    base_price,
    base_original_price,
    is_featured,
    stock_xs,
    stock_s,
    stock_m,
    stock_l,
    stock_xl,
    stock_xxl
  )
)
INSERT INTO products (
  name,
  description,
  fabric,
  print_type,
  category,
  image_url,
  image_url_1,
  image_url_2,
  image_url_3,
  image_url_4,
  image_url_5,
  price,
  original_price,
  discount_percent,
  size_xs_price,
  size_s_price,
  size_m_price,
  size_l_price,
  size_xl_price,
  size_xxl_price,
  size_xs_stock,
  size_s_stock,
  size_m_stock,
  size_l_stock,
  size_xl_stock,
  size_xxl_stock,
  stock_quantity,
  is_featured
)
SELECT
  b.name,
  b.description,
  b.fabric,
  b.print_type,
  b.category,
  b.primary_image,
  b.primary_image,
  'https://images.unsplash.com/photo-1516762689617-e1cffcef479d',
  'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8ef',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27',
  b.base_price,
  b.base_original_price,
  ROUND(((b.base_original_price - b.base_price) / NULLIF(b.base_original_price, 0)) * 100)::INT,
  (b.base_price - 200)::NUMERIC(10,2),
  (b.base_price - 100)::NUMERIC(10,2),
  b.base_price,
  (b.base_price + 100)::NUMERIC(10,2),
  (b.base_price + 200)::NUMERIC(10,2),
  (b.base_price + 300)::NUMERIC(10,2),
  b.stock_xs,
  b.stock_s,
  b.stock_m,
  b.stock_l,
  b.stock_xl,
  b.stock_xxl,
  (b.stock_xs + b.stock_s + b.stock_m + b.stock_l + b.stock_xl + b.stock_xxl),
  b.is_featured
FROM base_products b;

-- 9) SEED BANNERS (linked directly to specific product pages)
-- `link_to` is a product route: /product/{product_id}
INSERT INTO banners (title, subtitle, image_url, link_to) VALUES
(
  'TUF BEST SELLERS',
  'Engineered for Performance.',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  COALESCE((SELECT '/product/' || p.id::TEXT FROM products p WHERE p.name = 'Technical Cargo Pants' LIMIT 1), '/')
),
(
  'NEW ARRIVALS',
  'The Summer Drop is Here.',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
  COALESCE((SELECT '/product/' || p.id::TEXT FROM products p WHERE p.name = 'Heavyweight Boxy Tee' LIMIT 1), '/')
),
(
  'SEASONAL SALE',
  'Up to 50% Off.',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
  COALESCE((SELECT '/product/' || p.id::TEXT FROM products p WHERE p.name = 'Performance Stringer' LIMIT 1), '/')
);
