import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Bird = Tables<"birds">;
export type BirdInsert = TablesInsert<"birds">;
export type BirdUpdate = TablesUpdate<"birds">;

type BirdFilters = {
  search?: string;
  especie?: string;
  especieId?: string;
  sexo?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
};

export function useBirds(filters: BirdFilters = {}) {
  const { search, especie, especieId, sexo, estado, page = 0, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ["birds", filters],
    queryFn: async () => {
      let query = supabase
        .from("birds")
        .select("*, buyers:comprador_id(nombre, apellidos), species_catalog:especie_id(id, nombre_comun, nombre_especie), pareja:pareja_id(id, anilla, microchip, especie)", { count: "exact" });

      if (search) {
        query = query.or(
          `microchip.ilike.%${search}%,anilla.ilike.%${search}%,id_miteco.ilike.%${search}%,numero_cites.ilike.%${search}%,comentarios.ilike.%${search}%,zona.ilike.%${search}%`
        );
      }
      if (especie) query = query.eq("especie", especie as any);
      if (especieId) query = query.eq("especie_id", especieId);
      if (sexo) query = query.eq("sexo", sexo as any);
      if (estado === "vivo") query = query.is("fecha_muerte", null).is("fecha_cesion", null);
      if (estado === "muerto") query = query.not("fecha_muerte", "is", null);
      if (estado === "cedido") query = query.not("fecha_cesion", "is", null);

      query = query
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

export function useCreateBird() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bird: BirdInsert) => {
      const { data, error } = await supabase.from("birds").insert(bird).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["birds"] });
      toast.success("Ejemplar añadido correctamente");
    },
    onError: (e) => toast.error(`Error al añadir: ${e.message}`),
  });
}

export function useUpdateBird() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: BirdUpdate & { id: string }) => {
      const { data, error } = await supabase.from("birds").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["birds"] });
      toast.success("Ejemplar actualizado");
    },
    onError: (e) => toast.error(`Error al actualizar: ${e.message}`),
  });
}

export function useDeleteBird() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("birds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["birds"] });
      toast.success("Ejemplar eliminado");
    },
    onError: (e) => toast.error(`Error al eliminar: ${e.message}`),
  });
}
