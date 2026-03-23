
-- Create animal_attachments table
CREATE TABLE public.animal_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('bird', 'dog')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.animal_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Auth users full access animal_attachments"
  ON public.animal_attachments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage RLS policies
CREATE POLICY "Auth users can upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Auth users can read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "Auth users can delete attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');
