CREATE TABLE public.bulk_order_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  product_link text NOT NULL DEFAULT '',
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 1,
  size text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  admin_note text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'BD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.bulk_order_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_order_requests TO authenticated;
GRANT ALL ON public.bulk_order_requests TO service_role;

ALTER TABLE public.bulk_order_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit bulk order requests"
  ON public.bulk_order_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view bulk order requests"
  ON public.bulk_order_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bulk order requests"
  ON public.bulk_order_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bulk order requests"
  ON public.bulk_order_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bulk_order_requests_updated_at BEFORE UPDATE ON public.bulk_order_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();