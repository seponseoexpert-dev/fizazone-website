CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site settings admin write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
 ('company', '{"name":"Faiza Zone","email":"support@faizazone.com","phone":"+880 1798-113899","website":"https://faizazone.com","city":"Bhola","state":"Barishal","country_code":"BD","zip_code":"8300","address":"Bhola Sadar, Bhola, Bangladesh","latitude":"22.6859","longitude":"90.6482"}'::jsonb),
 ('site', '{"site_title":"Faiza Zone — Online Shopping & Gift Store","tagline":"Online Shopping & Gift Store","default_currency":"BDT","currency_symbol":"৳","default_language":"en","timezone":"Asia/Dhaka","maintenance_mode":false,"logo_url":"","favicon_url":""}'::jsonb),
 ('mail', '{"from_name":"Faiza Zone","from_email":"noreply@faizazone.com","smtp_host":"","smtp_port":"587","smtp_user":"","encryption":"tls"}'::jsonb),
 ('social', '{"facebook":"","instagram":"","tiktok":"","youtube":"","whatsapp":"+8801798113899","x":""}'::jsonb),
 ('shipping', '{"free_shipping_threshold":3000,"inside_dhaka":80,"outside_dhaka":130,"flat_rate":100,"delivery_note":"Delivery within 2-5 working days."}'::jsonb),
 ('notification', '{"order_placed_email":true,"order_status_email":true,"low_stock_alert":true,"low_stock_threshold":5,"admin_alert_email":"admin@faizazone.com"}'::jsonb),
 ('analytics', '{"meta_pixel_id":"","google_analytics_id":"","google_tag_manager_id":"","tiktok_pixel_id":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;