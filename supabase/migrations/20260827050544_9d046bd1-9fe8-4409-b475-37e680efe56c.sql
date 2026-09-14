GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

GRANT SELECT ON public.product_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sections TO authenticated;
GRANT ALL ON public.product_sections TO service_role;