
CREATE TABLE public.vaccination_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  completado BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccination_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access vaccination_reminders" ON public.vaccination_reminders FOR ALL USING (true) WITH CHECK (true);
