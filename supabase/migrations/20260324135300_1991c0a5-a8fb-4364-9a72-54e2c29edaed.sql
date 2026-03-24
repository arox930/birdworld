CREATE TABLE public.app_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text UNIQUE NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access app_licenses" ON public.app_licenses FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert access app_licenses" ON public.app_licenses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth full access app_licenses" ON public.app_licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);