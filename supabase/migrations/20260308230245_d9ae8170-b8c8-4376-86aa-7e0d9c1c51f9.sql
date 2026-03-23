
CREATE TABLE public.map_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  width integer NOT NULL DEFAULT 200,
  height integer NOT NULL DEFAULT 150,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.map_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access map_zones"
  ON public.map_zones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
