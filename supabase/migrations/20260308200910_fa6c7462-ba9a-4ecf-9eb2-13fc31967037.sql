
CREATE OR REPLACE FUNCTION public.sync_bird_pareja()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When pareja_id is set or changed
  IF NEW.pareja_id IS DISTINCT FROM OLD.pareja_id THEN
    -- Remove old partner's reference back
    IF OLD.pareja_id IS NOT NULL THEN
      UPDATE public.birds SET pareja_id = NULL WHERE id = OLD.pareja_id AND pareja_id = OLD.id;
    END IF;
    -- Set new partner's reference back
    IF NEW.pareja_id IS NOT NULL THEN
      UPDATE public.birds SET pareja_id = NEW.id WHERE id = NEW.pareja_id AND pareja_id IS DISTINCT FROM NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_bird_pareja
AFTER UPDATE OF pareja_id ON public.birds
FOR EACH ROW
EXECUTE FUNCTION public.sync_bird_pareja();

-- Also handle INSERT
CREATE OR REPLACE FUNCTION public.sync_bird_pareja_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pareja_id IS NOT NULL THEN
    UPDATE public.birds SET pareja_id = NEW.id WHERE id = NEW.pareja_id AND pareja_id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_bird_pareja_insert
AFTER INSERT ON public.birds
FOR EACH ROW
EXECUTE FUNCTION public.sync_bird_pareja_insert();
