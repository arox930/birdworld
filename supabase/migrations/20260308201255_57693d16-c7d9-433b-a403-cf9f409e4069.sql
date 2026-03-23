
CREATE OR REPLACE FUNCTION public.sync_bird_pareja_on_death()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When fecha_muerte is set and bird had a partner
  IF NEW.fecha_muerte IS NOT NULL AND OLD.fecha_muerte IS NULL AND NEW.pareja_id IS NOT NULL THEN
    -- Clear partner's reference
    UPDATE public.birds SET pareja_id = NULL WHERE id = NEW.pareja_id AND pareja_id = NEW.id;
    -- Clear own reference
    NEW.pareja_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_bird_pareja_on_death
BEFORE UPDATE OF fecha_muerte ON public.birds
FOR EACH ROW
EXECUTE FUNCTION public.sync_bird_pareja_on_death();
