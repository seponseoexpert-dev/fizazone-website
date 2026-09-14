ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS iso_code text,
  ADD COLUMN IF NOT EXISTS url_prefix text,
  ADD COLUMN IF NOT EXISTS is_default_market boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS number_format text NOT NULL DEFAULT '1,234.56',
  ADD COLUMN IF NOT EXISTS fx_rate numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS canonical_base text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hreflang text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS og_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS og_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS storefront_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_payment_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS regional_pricing_enabled boolean NOT NULL DEFAULT false;

UPDATE public.countries SET
  iso_code = 'BD', url_prefix = 'bd', locale = 'bn-BD', timezone = 'Asia/Dhaka',
  fx_rate = 1, hreflang = 'bn-BD', sort_order = 1, cod_enabled = true,
  seo_title = COALESCE(NULLIF(seo_title, ''), 'Faiza Zone Bangladesh — Prices in BDT, Cash on Delivery'),
  seo_description = COALESCE(NULLIF(seo_description, ''), 'Shop Faiza Zone in Bangladesh: prices in BDT, flat 100 BDT delivery, free over 2000 BDT, cash on delivery, bKash and Nagad.')
WHERE code = 'bd';

UPDATE public.countries SET
  iso_code = 'GB', url_prefix = 'uk', locale = 'en-GB', timezone = 'Europe/London',
  fx_rate = 0.0066, hreflang = 'en-GB', sort_order = 2,
  seo_title = COALESCE(NULLIF(seo_title, ''), 'Faiza Zone UK — Shop in GBP with Tracked Delivery'),
  seo_description = COALESCE(NULLIF(seo_description, ''), 'Shop Faiza Zone in the United Kingdom: prices in GBP, tracked delivery and secure card checkout.')
WHERE code = 'uk';

UPDATE public.countries SET
  iso_code = 'US', url_prefix = 'us', locale = 'en-US', timezone = 'America/New_York',
  fx_rate = 0.0085, hreflang = 'en-US', sort_order = 3,
  seo_title = COALESCE(NULLIF(seo_title, ''), 'Faiza Zone USA — Shop in USD with Fast Shipping'),
  seo_description = COALESCE(NULLIF(seo_description, ''), 'Shop Faiza Zone in the United States: prices in USD, flat shipping and secure card checkout.')
WHERE code IN ('us','usa');

UPDATE public.countries SET
  iso_code = 'CA', url_prefix = 'ca', locale = 'en-CA', timezone = 'America/Toronto',
  fx_rate = 0.0115, hreflang = 'en-CA', sort_order = 4
WHERE code = 'ca';

UPDATE public.countries SET
  iso_code = 'AU', url_prefix = 'au', locale = 'en-AU', timezone = 'Australia/Sydney',
  fx_rate = 0.013, hreflang = 'en-AU', sort_order = 5
WHERE code = 'au';

UPDATE public.countries SET iso_code = UPPER(code) WHERE iso_code IS NULL OR iso_code = '';
UPDATE public.countries SET url_prefix = LOWER(code) WHERE url_prefix IS NULL OR url_prefix = '';

INSERT INTO public.countries
  (name, code, currency, currency_symbol, default_language, phone_code, is_active,
   iso_code, url_prefix, is_default_market, sort_order, locale, timezone, fx_rate, hreflang,
   seo_title, seo_description, cod_enabled)
SELECT 'Global', 'global', 'USD', '$', 'en', '', true,
       'XX', 'global', true, 0, 'en', 'UTC', 0.0085, 'x-default',
       'Faiza Zone — Fashion, Footwear & Accessories Online',
       'Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone.', false
WHERE NOT EXISTS (SELECT 1 FROM public.countries WHERE code = 'global');

CREATE UNIQUE INDEX IF NOT EXISTS countries_url_prefix_key ON public.countries (LOWER(url_prefix));
CREATE UNIQUE INDEX IF NOT EXISTS countries_iso_code_key ON public.countries (UPPER(iso_code));
CREATE UNIQUE INDEX IF NOT EXISTS countries_one_default_market ON public.countries (is_default_market) WHERE is_default_market;