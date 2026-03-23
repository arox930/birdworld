import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BirdCommonName = {
  id: string;
  nombre: string;
  created_at: string;
};

export function useBirdCommonNames() {
  return useQuery({
    queryKey: ["bird_common_names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bird_common_names")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as BirdCommonName[];
    },
  });
}

export function useCreateBirdCommonName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase
        .from("bird_common_names")
        .insert({ nombre })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bird_common_names"] });
      toast.success("Nombre común añadido");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteBirdCommonName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bird_common_names").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bird_common_names"] });
      toast.success("Nombre común eliminado");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}
