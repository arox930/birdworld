
CREATE TABLE public.cession_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('bird', 'dog')),
  group_key TEXT NOT NULL,
  template_content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (animal_type, group_key)
);

ALTER TABLE public.cession_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access cession_templates"
ON public.cession_templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_cession_templates_updated_at
BEFORE UPDATE ON public.cession_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
