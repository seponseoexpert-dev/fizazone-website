ALTER TABLE public.product_country_map
  ADD COLUMN IF NOT EXISTS sale_price numeric,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0;