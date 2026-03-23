
DROP POLICY "Auth users full access map_folders" ON public.map_folders;

CREATE POLICY "Auth users full access map_folders" ON public.map_folders
  AS PERMISSIVE FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
