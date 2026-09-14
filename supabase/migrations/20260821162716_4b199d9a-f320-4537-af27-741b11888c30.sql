CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT '',
  button_link text NOT NULL DEFAULT '/categories',
  sort_order integer NOT NULL DEFAULT 0,
  country_code text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners admin write" ON public.banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'editor',
  country_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO authenticated;
GRANT ALL ON public.admin_roles TO service_role;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin roles admin write" ON public.admin_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin roles read own" ON public.admin_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER admin_roles_updated_at BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'bd';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'bd';

INSERT INTO public.banners (image_url, title, subtitle, button_text, button_link, sort_order, country_code)
VALUES
  ('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80', 'New Season Arrivals', 'Fresh styles for every day', 'SHOP THE LOOK', '/categories', 1, 'all'),
  ('https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80', 'Women''s Edit', 'Elegant picks, everyday comfort', 'SHOP WOMEN', '/categories?category=WOMEN', 2, 'all'),
  ('https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1600&q=80', 'Junior Collection', 'Playful looks for little ones', 'SHOP JUNIORS', '/categories?category=JUNIORS', 3, 'all');