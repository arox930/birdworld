
-- Drop foreign key constraints first
ALTER TABLE public.dogs DROP CONSTRAINT IF EXISTS dogs_comprador_id_fkey;
ALTER TABLE public.dogs DROP CONSTRAINT IF EXISTS dogs_litter_id_fkey;
ALTER TABLE public.dogs DROP CONSTRAINT IF EXISTS dogs_madre_id_fkey;
ALTER TABLE public.vaccines DROP CONSTRAINT IF EXISTS vaccines_dog_id_fkey;
ALTER TABLE public.vaccination_reminders DROP CONSTRAINT IF EXISTS vaccination_reminders_dog_id_fkey;
ALTER TABLE public.litters DROP CONSTRAINT IF EXISTS litters_mother_dog_id_fkey;

-- Drop RLS policies
DROP POLICY IF EXISTS "Auth users full access dogs" ON public.dogs;
DROP POLICY IF EXISTS "Auth users full access vaccines" ON public.vaccines;
DROP POLICY IF EXISTS "Auth users full access vaccination_reminders" ON public.vaccination_reminders;
DROP POLICY IF EXISTS "Auth users full access litters" ON public.litters;

-- Drop tables
DROP TABLE IF EXISTS public.vaccination_reminders;
DROP TABLE IF EXISTS public.vaccines;
DROP TABLE IF EXISTS public.litters;
DROP TABLE IF EXISTS public.dogs;
