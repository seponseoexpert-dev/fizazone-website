ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_sku text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.product_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  title text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_meta_description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stock integer NOT NULL DEFAULT 0,
  slug text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  images text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, country_code)
);

GRANT SELECT ON public.product_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_translations TO authenticated;
GRANT ALL ON public.product_translations TO service_role;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product translations public read" ON public.product_translations FOR SELECT USING (true);
CREATE POLICY "product translations admin write" ON public.product_translations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER product_translations_updated_at BEFORE UPDATE ON public.product_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.category_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  name text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_meta_description text NOT NULL DEFAULT '',
  banner_image text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, country_code)
);

GRANT SELECT ON public.category_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_translations TO authenticated;
GRANT ALL ON public.category_translations TO service_role;
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category translations public read" ON public.category_translations FOR SELECT USING (true);
CREATE POLICY "category translations admin write" ON public.category_translations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER category_translations_updated_at BEFORE UPDATE ON public.category_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing products into a BD translation
INSERT INTO public.product_translations
  (product_id, country_code, title, full_description, seo_title, seo_meta_description, price, currency, stock, slug, is_visible, images)
SELECT
  p.id, 'bd', p.name, COALESCE(p.description, ''), p.name, LEFT(COALESCE(p.description, p.name), 155),
  COALESCE(p.sale_price, p.price), 'BDT',
  COALESCE((SELECT SUM(v.stock_qty) FROM public.product_variants v WHERE v.product_id = p.id), 0),
  p.slug, true, COALESCE(p.images, '{}'::text[])
FROM public.products p
ON CONFLICT (product_id, country_code) DO NOTHING;

-- Migrate existing categories
INSERT INTO public.categories (base_slug)
SELECT DISTINCT lower(category) FROM public.products WHERE COALESCE(category, '') <> ''
ON CONFLICT (base_slug) DO NOTHING;

INSERT INTO public.categories (base_slug)
SELECT DISTINCT lower(category) FROM public.category_country_map WHERE COALESCE(category, '') <> ''
ON CONFLICT (base_slug) DO NOTHING;

INSERT INTO public.category_translations
  (category_id, country_code, name, seo_title, seo_meta_description, banner_image, slug, is_visible)
SELECT c.id, 'bd', upper(c.base_slug), upper(c.base_slug), '', '', c.base_slug, true
FROM public.categories c
ON CONFLICT (category_id, country_code) DO NOTHING;