CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  customer_name text NOT NULL DEFAULT 'Guest',
  rating integer NOT NULL DEFAULT 5,
  title text,
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved reviews public read" ON public.product_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "own reviews read" ON public.product_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admin reviews read" ON public.product_reviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own reviews insert" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin reviews update" ON public.product_reviews
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin reviews delete" ON public.product_reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER product_reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX product_reviews_product_idx ON public.product_reviews(product_id);
CREATE INDEX product_reviews_status_idx ON public.product_reviews(status);

INSERT INTO public.product_reviews (product_id, customer_name, rating, title, comment, status)
SELECT p.id, v.name, v.rating, v.title, v.comment, v.status
FROM (VALUES
  ('Rahim Uddin', 5, 'Great quality', 'Fabric is soft and the fit is perfect. Delivery was fast.', 'approved'),
  ('Nusrat Jahan', 4, 'Nice product', 'Colour is slightly different from the photo but still lovely.', 'approved'),
  ('Tanvir Hasan', 3, 'Average', 'Stitching could be better for this price.', 'pending')
) AS v(name, rating, title, comment, status)
CROSS JOIN LATERAL (SELECT id FROM public.products ORDER BY created_at DESC LIMIT 1) p;