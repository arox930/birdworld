import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MapZone {
  id: string;
  nombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  folder_id: string | null;
  created_at: string;
}

export function useMapZones() {
  return useQuery({
    queryKey: ["map_zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("map_zones").select("*").order("nombre");
      if (error) throw error;
      return data as MapZone[];
    },
  });
}

export function useCreateMapZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: { nombre: string; x?: number; y?: number; color?: string; folder_id?: string }) => {
      const { data, error } = await supabase.from("map_zones").insert(zone).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_zones"] }),
  });
}

export function useUpdateMapZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MapZone> & { id: string }) => {
      const { error } = await supabase.from("map_zones").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_zones"] }),
  });
}

export function useDeleteMapZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("map_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_zones"] }),
  });
}

export function useUnmappedZones(mapZones: MapZone[] | undefined) {
  return useQuery({
    queryKey: ["unmapped_zones", mapZones?.map((z) => z.nombre)],
    queryFn: async () => {
      const { data: birds } = await supabase.from("birds").select("zona").not("zona", "is", null);
      const allZones = new Set<string>();
      birds?.forEach((b) => b.zona && allZones.add(b.zona));
      const mapped = new Set(mapZones?.map((z) => z.nombre) ?? []);
      return Array.from(allZones).filter((z) => !mapped.has(z)).sort();
    },
    enabled: mapZones !== undefined,
  });
}

interface AnimalOnMap {
  id: string;
  type: "bird";
  label: string;
  zona: string | null;
  pareja_id?: string | null;
}

export function useAnimalsForMap() {
  return useQuery({
    queryKey: ["animals_for_map"],
    queryFn: async () => {
      const { data: birds } = await supabase.from("birds").select("id, anilla, microchip, especie, zona, fecha_muerte, fecha_cesion, pareja_id");
      const animals: AnimalOnMap[] = [];
      birds?.filter(b => !b.fecha_muerte && !b.fecha_cesion).forEach((b) => {
        animals.push({
          id: b.id,
          type: "bird",
          label: b.anilla || b.microchip || b.especie,
          zona: b.zona,
          pareja_id: b.pareja_id,
        });
      });
      return animals;
    },
  });
}

export function useUpdateAnimalZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, zona }: { id: string; type?: string; zona: string | null }) => {
      const { error } = await supabase.from("birds").update({ zona }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["animals_for_map"] });
      qc.invalidateQueries({ queryKey: ["birds"] });
    },
  });
}

export function usePairBirds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bird1Id, bird2Id, unpair }: { bird1Id: string; bird2Id: string; unpair?: boolean }) => {
      const newValue = unpair ? null : bird2Id;
      const newValue2 = unpair ? null : bird1Id;
      const { error: e1 } = await supabase.from("birds").update({ pareja_id: newValue }).eq("id", bird1Id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("birds").update({ pareja_id: newValue2 }).eq("id", bird2Id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["animals_for_map"] });
      qc.invalidateQueries({ queryKey: ["birds"] });
    },
  });
}
