CREATE TABLE public.return_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_ref text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 1,
  refund_amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  resolution text NOT NULL DEFAULT 'refund',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'bd',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.return_orders TO authenticated;
GRANT ALL ON public.return_orders TO service_role;

ALTER TABLE public.return_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage return orders"
ON public.return_orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_return_orders_updated_at
BEFORE UPDATE ON public.return_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
