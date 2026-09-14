ALTER TABLE public.category_translations
  ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS long_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;