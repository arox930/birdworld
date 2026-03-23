
-- Create bird species catalog table
CREATE TABLE public.bird_species_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comun text NOT NULL,
  nombre_especie text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(nombre_comun, nombre_especie)
);

-- Enable RLS
ALTER TABLE public.bird_species_catalog ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users
CREATE POLICY "Auth users full access bird_species_catalog"
  ON public.bird_species_catalog
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add especie_id column to birds (nullable for existing records)
ALTER TABLE public.birds ADD COLUMN especie_id uuid REFERENCES public.bird_species_catalog(id) ON DELETE SET NULL;
