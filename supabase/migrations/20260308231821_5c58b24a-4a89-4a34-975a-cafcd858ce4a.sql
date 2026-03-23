
CREATE TABLE public.map_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  width integer NOT NULL DEFAULT 400,
  height integer NOT NULL DEFAULT 300,
  color text NOT NULL DEFAULT '#6366f1',
  collapsed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.map_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access map_folders" ON public.map_folders
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE public.map_zones ADD COLUMN folder_id uuid REFERENCES public.map_folders(id) ON DELETE SET NULL;
