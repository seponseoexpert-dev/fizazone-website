CREATE TABLE public.coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  code text not null,
  discount numeric not null default 0,
  discount_type text not null default 'fixed',
  min_order numeric not null default 0,
  usage_limit integer not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz not null default (now() + interval '1 year'),
  country_code text not null default 'all',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE UNIQUE INDEX coupons_code_key ON public.coupons (lower(code));
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons admin write" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  type text not null default 'small',
  image_url text not null default '',
  link text not null default '/categories',
  sort_order integer not null default 0,
  country_code text not null default 'all',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions public read" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "promotions admin write" ON public.promotions FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  slug text not null default '',
  layout text not null default 'grid',
  category text not null default '',
  sort_order integer not null default 0,
  country_code text not null default 'all',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.product_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sections TO authenticated;
GRANT ALL ON public.product_sections TO service_role;
ALTER TABLE public.product_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product sections public read" ON public.product_sections FOR SELECT USING (true);
CREATE POLICY "product sections admin write" ON public.product_sections FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER product_sections_updated_at BEFORE UPDATE ON public.product_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.coupons (name, code, discount, discount_type) VALUES
  ('Festive Dressing','festive',50,'fixed'),
  ('Super Denim Collection','denim',15,'percentage');
INSERT INTO public.promotions (name, type, sort_order) VALUES
  ('Winter collection','big',1),
  ('Winter exclusive for kids','small',2),
  ('Winter exclusive for woman','small',3),
  ('Winter exclusive for man','small',4);
INSERT INTO public.product_sections (name, slug, sort_order) VALUES
  ('Trendy Collections','trendy-collections',1);