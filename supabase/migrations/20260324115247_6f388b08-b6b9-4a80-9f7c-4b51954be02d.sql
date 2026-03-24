CREATE POLICY "Public full access bird_species_catalog"
  ON public.bird_species_catalog FOR ALL TO anon
  USING (true) WITH CHECK (true);