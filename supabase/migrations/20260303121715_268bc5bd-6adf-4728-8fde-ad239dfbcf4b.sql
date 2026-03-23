
-- Enum types
CREATE TYPE public.bird_species AS ENUM ('Guacamayo', 'Lori', 'Ninfa', 'Yaco', 'Cacatua', 'Pirrura', 'Amazona');
CREATE TYPE public.animal_sex AS ENUM ('Macho', 'Hembra', 'Desconocido');
CREATE TYPE public.animal_type AS ENUM ('bird', 'dog');

-- Buyers
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT NOT NULL,
  domicilio TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access buyers" ON public.buyers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Birds
CREATE TABLE public.birds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_miteco TEXT,
  microchip TEXT,
  anilla TEXT,
  numero_cites TEXT,
  sexo public.animal_sex NOT NULL DEFAULT 'Desconocido',
  especie public.bird_species NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  fecha_muerte DATE,
  fecha_cesion DATE,
  comprador_id UUID REFERENCES public.buyers(id),
  comprador_texto TEXT,
  padre_id UUID REFERENCES public.birds(id),
  padre_externo TEXT,
  madre_id UUID REFERENCES public.birds(id),
  madre_externa TEXT,
  zona TEXT,
  pareja_id UUID REFERENCES public.birds(id),
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access birds" ON public.birds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dogs
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microchip TEXT,
  sexo public.animal_sex NOT NULL DEFAULT 'Desconocido',
  nombre TEXT NOT NULL,
  pedigree TEXT,
  raza TEXT NOT NULL,
  color TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  fecha_muerte DATE,
  fecha_cesion DATE,
  comprador_id UUID REFERENCES public.buyers(id),
  comprador_texto TEXT,
  madre_id UUID REFERENCES public.dogs(id),
  madre_externa TEXT,
  ultima_vacunacion DATE,
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access dogs" ON public.dogs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cessions
CREATE TABLE public.cessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_type public.animal_type NOT NULL,
  animal_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.buyers(id),
  precio NUMERIC(10,2) NOT NULL,
  fecha_cesion DATE NOT NULL DEFAULT CURRENT_DATE,
  pdf_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access cessions" ON public.cessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vaccines
CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access vaccines" ON public.vaccines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Litters (camadas)
CREATE TABLE public.litters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  nacidos_total INT NOT NULL,
  muertos_parto INT NOT NULL DEFAULT 0,
  machos INT NOT NULL DEFAULT 0,
  hembras INT NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.litters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users full access litters" ON public.litters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_birds_updated_at BEFORE UPDATE ON public.birds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('cessions', 'cessions', false);

CREATE POLICY "Auth users upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('uploads', 'cessions'));
CREATE POLICY "Auth users read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('uploads', 'cessions'));
CREATE POLICY "Auth users delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('uploads', 'cessions'));
