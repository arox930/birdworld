import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useExistingZones() {
  return useQuery({
    queryKey: ["existing_zones"],
    queryFn: async () => {
      const [{ data: birds }, { data: mapZones }] = await Promise.all([
        supabase.from("birds").select("zona").not("zona", "is", null),
        supabase.from("map_zones").select("nombre"),
      ]);
      const zones = new Set<string>();
      birds?.forEach((b) => b.zona && zones.add(b.zona));
      mapZones?.forEach((m) => zones.add(m.nombre));
      return Array.from(zones).sort();
    },
  });
}
