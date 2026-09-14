INSERT INTO public.countries (name, code, currency, currency_symbol, default_language, phone_code, is_active)
SELECT v.name, v.code, v.currency, v.symbol, 'en', v.phone, false
FROM (VALUES
  ('United States','usa','USD','$','+1'),
  ('United Kingdom','uk','GBP','£','+44'),
  ('Canada','ca','CAD','C$','+1'),
  ('Australia','au','AUD','A$','+61')
) AS v(name, code, currency, symbol, phone)
WHERE NOT EXISTS (
  SELECT 1 FROM public.countries c WHERE lower(c.code) = v.code
);