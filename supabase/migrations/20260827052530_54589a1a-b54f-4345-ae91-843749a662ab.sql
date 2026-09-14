CREATE POLICY "site_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images');
CREATE POLICY "site_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-images') WITH CHECK (bucket_id = 'site-images');
CREATE POLICY "site_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-images');
CREATE POLICY "site_images_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-images');