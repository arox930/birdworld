import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Dog = Tables<"dogs">;
export type DogInsert = TablesInsert<"dogs">;
export type DogUpdate = TablesUpdate<"dogs">;
export type Vaccine = Tables<"vaccines">;
export type Litter = Tables<"litters">;

type DogFilters = {
  search?: string;
  sexo?: string;
  raza?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
};

export function useDogs(filters: DogFilters = {}) {
  const { search, sexo, raza, estado, page = 0, pageSize = 20 } = filters;
  return useQuery({
    queryKey: ["dogs", filters],
    queryFn: async () => {
      let query = supabase
        .from("dogs")
        .select("*, buyers:comprador_id(nombre, apellidos)", { count: "exact" });

      if (search) {
        query = query.or(
          `microchip.ilike.%${search}%,nombre.ilike.%${search}%,raza.ilike.%${search}%,comentarios.ilike.%${search}%,zona.ilike.%${search}%`
        );
      }
      if (sexo) query = query.eq("sexo", sexo as any);
      if (raza) query = query.ilike("raza", `%${raza}%`);
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

export function useCreateDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dog: DogInsert) => {
      const { data, error } = await supabase.from("dogs").insert(dog).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dogs"] }); toast.success("Perro añadido correctamente"); },
    onError: (e) => toast.error(`Error al añadir: ${e.message}`),
  });
}

export function useUpdateDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: DogUpdate & { id: string }) => {
      const { data, error } = await supabase.from("dogs").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dogs"] }); toast.success("Perro actualizado"); },
    onError: (e) => toast.error(`Error al actualizar: ${e.message}`),
  });
}

export function useDeleteDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dogs"] }); toast.success("Perro eliminado"); },
    onError: (e) => toast.error(`Error al eliminar: ${e.message}`),
  });
}

// Vaccines
export function useVaccines(dogId: string | null) {
  return useQuery({
    queryKey: ["vaccines", dogId],
    enabled: !!dogId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vaccines")
        .select("*")
        .eq("dog_id", dogId!)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVaccine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vaccine: { dog_id: string; fecha: string; descripcion: string }) => {
      const { data, error } = await supabase.from("vaccines").insert(vaccine).select().single();
      if (error) throw error;
      // Update ultima_vacunacion on dog
      await supabase.from("dogs").update({ ultima_vacunacion: vaccine.fecha }).eq("id", vaccine.dog_id);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["vaccines", vars.dog_id] });
      qc.invalidateQueries({ queryKey: ["dogs"] });
      toast.success("Vacuna registrada");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

// Litters
export function useLitters(dogId: string | null) {
  return useQuery({
    queryKey: ["litters", dogId],
    enabled: !!dogId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("litters")
        .select("*")
        .eq("mother_dog_id", dogId!)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLitter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (litter: { mother_dog_id: string; fecha: string; nacidos_total: number; muertos_parto: number; machos: number; hembras: number; notas?: string }) => {
      const { data, error } = await supabase.from("litters").insert(litter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["litters", vars.mother_dog_id] });
      toast.success("Camada registrada");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateLitter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; fecha?: string; nacidos_total?: number; muertos_parto?: number; machos?: number; hembras?: number; notas?: string | null }) => {
      const { error } = await supabase.from("litters").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["litters"] });
      toast.success("Camada actualizada");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteLitter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("litters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["litters"] });
      toast.success("Camada eliminada");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}
