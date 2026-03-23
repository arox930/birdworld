
CREATE POLICY "Public full access bird_common_names"
  ON public.bird_common_names FOR ALL TO anon
  USING (true) WITH CHECK (true);
