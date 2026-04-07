import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PairBird = {
  id: string;
  anilla: string | null;
  microchip: string | null;
  sexo: string;
  especie: string;
  especie_id: string | null;
  numero_cites: string | null;
  id_miteco: string | null;
  zona: string | null;
  comentarios: string | null;
  fecha_nacimiento: string;
  fecha_muerte: string | null;
  fecha_cesion: string | null;
  pareja_id: string | null;
  species_catalog: { id: string; nombre_comun: string; nombre_especie: string } | null;
};

export type Pair = {
  id: string; // use the bird with lower id as pair key
  bird1: PairBird;
  bird2: PairBird;
};

type PairFilters = {
  search?: string;
  commonName?: string;
  speciesId?: string;
};

export function usePairs(filters: PairFilters = {}) {
  const { search, commonName, speciesId } = filters;

  return useQuery({
    queryKey: ["pairs", filters],
    queryFn: async () => {
      // Fetch all birds that have a pareja_id set
      const { data, error } = await supabase
        .from("birds")
        .select("id, anilla, microchip, sexo, especie, especie_id, numero_cites, id_miteco, zona, comentarios, fecha_nacimiento, fecha_muerte, fecha_cesion, pareja_id, species_catalog:especie_id(id, nombre_comun, nombre_especie)")
        .not("pareja_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const birds = (data ?? []) as unknown as PairBird[];

      // Group into pairs - use sorted id pair as key to deduplicate
      const pairMap = new Map<string, Pair>();
      for (const bird of birds) {
        if (!bird.pareja_id) continue;
        const pairKey = [bird.id, bird.pareja_id].sort().join("-");
        if (pairMap.has(pairKey)) continue;

        const partner = birds.find(b => b.id === bird.pareja_id);
        if (!partner) continue;

        // Ensure male first, female second
        const [bird1, bird2] = bird.sexo === "Macho" ? [bird, partner] : [partner, bird];
        pairMap.set(pairKey, { id: pairKey, bird1, bird2 });
      }

      let pairs = Array.from(pairMap.values());

      // Apply filters
      if (commonName) {
        pairs = pairs.filter(p => p.bird1.especie === commonName || p.bird2.especie === commonName);
      }
      if (speciesId) {
        pairs = pairs.filter(p => p.bird1.especie_id === speciesId || p.bird2.especie_id === speciesId);
      }
      if (search) {
        const s = search.toLowerCase();
        pairs = pairs.filter(p => {
          const fields = [
            p.bird1.anilla, p.bird1.microchip, p.bird1.numero_cites, p.bird1.id_miteco,
            p.bird1.zona, p.bird1.comentarios, p.bird1.especie,
            p.bird2.anilla, p.bird2.microchip, p.bird2.numero_cites, p.bird2.id_miteco,
            p.bird2.zona, p.bird2.comentarios, p.bird2.especie,
            p.bird1.species_catalog?.nombre_especie, p.bird1.species_catalog?.nombre_comun,
            p.bird2.species_catalog?.nombre_especie, p.bird2.species_catalog?.nombre_comun,
          ];
          return fields.some(f => f && f.toLowerCase().includes(s));
        });
      }

      return pairs;
    },
  });
}

export function usePairOffspring(parentId1: string | null, parentId2: string | null) {
  return useQuery({
    queryKey: ["pair-offspring", parentId1, parentId2],
    enabled: !!parentId1 && !!parentId2,
    queryFn: async () => {
      if (!parentId1 || !parentId2) return [];

      // Find birds that have BOTH parents matching the pair (in either direction)
      const { data, error } = await supabase
        .from("birds")
        .select("id, anilla, microchip, sexo, especie, fecha_nacimiento, fecha_muerte, fecha_cesion, numero_cites, id_miteco, zona, species_catalog:especie_id(id, nombre_comun, nombre_especie)")
        .or(`and(padre_id.eq.${parentId1},madre_id.eq.${parentId2}),and(padre_id.eq.${parentId2},madre_id.eq.${parentId1})`)
        .order("fecha_nacimiento", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}
