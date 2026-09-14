CREATE TABLE public.seo_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL DEFAULT 'static',
  page_key text NOT NULL DEFAULT '',
  page_label text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'bd',
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  hreflang jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_type, page_key, country_code)
);

GRANT SELECT ON public.seo_meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_meta TO authenticated;
GRANT ALL ON public.seo_meta TO service_role;

ALTER TABLE public.seo_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo meta public read" ON public.seo_meta FOR SELECT USING (true);
CREATE POLICY "seo meta admin write" ON public.seo_meta FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER seo_meta_updated_at BEFORE UPDATE ON public.seo_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.seo_config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_config TO authenticated;
GRANT ALL ON public.seo_config TO service_role;

ALTER TABLE public.seo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo config public read" ON public.seo_config FOR SELECT USING (true);
CREATE POLICY "seo config admin write" ON public.seo_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER seo_config_updated_at BEFORE UPDATE ON public.seo_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.seo_config (key, value) VALUES
  ('robots_txt', E'User-agent: *\nAllow: /\n');

INSERT INTO public.seo_meta (page_type, page_key, page_label, country_code, meta_title, meta_description, slug, canonical_url) VALUES
  ('home', 'home', 'Homepage', 'bd', 'fiza Lifestyle — Fashion Store in Bangladesh', 'Shop the latest men, women and juniors fashion at fiza Lifestyle Bangladesh.', '/bd', 'https://fizazone.lovable.app/bd'),
  ('home', 'home', 'Homepage', 'uk', 'fiza Lifestyle UK — Modern Fashion', 'Discover men, women and juniors fashion delivered across the UK.', '/uk', 'https://fizazone.lovable.app/uk'),
  ('home', 'home', 'Homepage', 'us', 'fiza Lifestyle US — Modern Fashion', 'Discover men, women and juniors fashion delivered across the USA.', '/usa', 'https://fizazone.lovable.app/usa'),
  ('home', 'home', 'Homepage', 'ca', 'fiza Lifestyle Canada — Modern Fashion', 'Discover men, women and juniors fashion delivered across Canada.', '/ca', 'https://fizazone.lovable.app/ca'),
  ('category', 'MEN', 'Category: MEN', 'bd', 'Men''s Fashion — fiza Lifestyle', 'Shirts, tees, denim and more for men.', '/categories?category=MEN', 'https://fizazone.lovable.app/categories?category=MEN'),
  ('category', 'WOMEN', 'Category: WOMEN', 'bd', 'Women''s Fashion — fiza Lifestyle', 'Dresses, tops and everyday essentials for women.', '/categories?category=WOMEN', 'https://fizazone.lovable.app/categories?category=WOMEN'),
  ('category', 'JUNIORS', 'Category: JUNIORS', 'bd', 'Juniors Fashion — fiza Lifestyle', 'Comfortable, playful styles for juniors.', '/categories?category=JUNIORS', 'https://fizazone.lovable.app/categories?category=JUNIORS');