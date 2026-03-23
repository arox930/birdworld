
-- Create bird_common_names table for dynamic common names
CREATE TABLE public.bird_common_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bird_common_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access bird_common_names"
  ON public.bird_common_names FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Seed with existing enum values
INSERT INTO public.bird_common_names (nombre) VALUES
  ('Guacamayo'), ('Lori'), ('Ninfa'), ('Yaco'), ('Cacatua'), ('Pirrura'), ('Amazona');

-- Change birds.especie from enum to text
ALTER TABLE public.birds ALTER COLUMN especie TYPE text USING especie::text;

-- Drop the old enum
DROP TYPE IF EXISTS public.bird_species;
