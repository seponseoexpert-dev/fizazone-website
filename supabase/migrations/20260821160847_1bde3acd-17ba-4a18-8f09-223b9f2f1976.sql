CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  default_language text NOT NULL DEFAULT 'en',
  phone_code text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries public read" ON public.countries FOR SELECT USING (true);
CREATE POLICY "countries admin write" ON public.countries FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.category_country_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  country_code text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  custom_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, country_code)
);
GRANT SELECT ON public.category_country_map TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_country_map TO authenticated;
GRANT ALL ON public.category_country_map TO service_role;
ALTER TABLE public.category_country_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccm public read" ON public.category_country_map FOR SELECT USING (true);
CREATE POLICY "ccm admin write" ON public.category_country_map FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER ccm_updated_at BEFORE UPDATE ON public.category_country_map FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_country_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stock_qty integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, country_code)
);
GRANT SELECT ON public.product_country_map TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_country_map TO authenticated;
GRANT ALL ON public.product_country_map TO service_role;
ALTER TABLE public.product_country_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcm public read" ON public.product_country_map FOR SELECT USING (true);
CREATE POLICY "pcm admin write" ON public.product_country_map FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER pcm_updated_at BEFORE UPDATE ON public.product_country_map FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.countries (name, code, currency, currency_symbol, default_language, phone_code, is_active) VALUES
  ('Bangladesh','bd','BDT','৳','en','+880',true),
  ('United Kingdom','uk','GBP','£','en','+44',true),
  ('United States','us','USD','$','en','+1',true),
  ('Canada','ca','CAD','C$','en','+1',true);

INSERT INTO public.category_country_map (category, country_code, is_visible)
SELECT c.cat, co.code, true
FROM (VALUES ('MEN'),('WOMEN'),('JUNIORS')) AS c(cat)
CROSS JOIN public.countries co;