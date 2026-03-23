
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('bird', 'dog')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access expenses" ON public.expenses
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
