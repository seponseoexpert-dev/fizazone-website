CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin settings"
ON public.admin_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin settings"
ON public.admin_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin settings"
ON public.admin_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin settings"
ON public.admin_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- migrate existing sensitive sections out of the public site_settings table
INSERT INTO public.admin_settings (key, value)
SELECT key, value FROM public.site_settings
WHERE key IN ('sms_gateway', 'payment_gateway', 'shipping_intl', 'mail', 'otp', 'notification')
ON CONFLICT (key) DO NOTHING;

DELETE FROM public.site_settings
WHERE key IN ('sms_gateway', 'payment_gateway', 'shipping_intl', 'mail', 'otp', 'notification');