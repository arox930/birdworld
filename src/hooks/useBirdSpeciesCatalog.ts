import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BirdSpeciesCatalog = {
  id: string;
  nombre_comun: string;
  nombre_especie: string;
  created_at: string;
};

export function useBirdSpeciesCatalog(nombreComun?: string) {
  return useQuery({
    queryKey: ["bird_species_catalog", nombreComun],
    queryFn: async () => {
      let query = supabase.from("bird_species_catalog").select("*").order("nombre_especie");
      if (nombreComun) query = query.eq("nombre_comun", nombreComun);
      const { data, error } = await query;
      if (error) throw error;
      return data as BirdSpeciesCatalog[];
    },
  });
}

export function useAllBirdSpeciesCatalog() {
  return useQuery({
    queryKey: ["bird_species_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bird_species_catalog")
        .select("*")
        .order("nombre_comun")
        .order("nombre_especie");
      if (error) throw error;
      return data as BirdSpeciesCatalog[];
    },
  });
}

export function useCreateBirdSpecies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (species: { nombre_comun: string; nombre_especie: string }) => {
      const { data, error } = await supabase
        .from("bird_species_catalog")
        .insert(species)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bird_species_catalog"] });
      toast.success("Especie añadida al catálogo");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteBirdSpecies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bird_species_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bird_species_catalog"] });
      toast.success("Especie eliminada del catálogo");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}
