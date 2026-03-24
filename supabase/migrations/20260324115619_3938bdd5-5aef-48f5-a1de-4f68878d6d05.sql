CREATE POLICY "Public full access birds" ON public.birds FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access buyers" ON public.buyers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cessions" ON public.cessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access expenses" ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access map_folders" ON public.map_folders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access map_zones" ON public.map_zones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access animal_attachments" ON public.animal_attachments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cession_templates" ON public.cession_templates FOR ALL TO anon USING (true) WITH CHECK (true);