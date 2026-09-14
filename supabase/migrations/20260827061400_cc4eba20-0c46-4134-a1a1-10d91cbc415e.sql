CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id uuid REFERENCES public.return_orders(id) ON DELETE SET NULL,
  order_ref text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  note text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'bd',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refunds"
ON public.refunds FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
