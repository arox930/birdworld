import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CessionTemplate {
  id: string;
  animal_type: string;
  group_key: string;
  template_content: string;
  created_at: string;
  updated_at: string;
}

export function useCessionTemplates() {
  return useQuery({
    queryKey: ["cession-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cession_templates")
        .select("*")
        .order("animal_type")
        .order("group_key");
      if (error) throw error;
      return data as CessionTemplate[];
    },
  });
}

export function useUpsertCessionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { animal_type: string; group_key: string; template_content: string }) => {
      const { data, error } = await supabase
        .from("cession_templates")
        .upsert(
          { animal_type: params.animal_type, group_key: params.group_key, template_content: params.template_content },
          { onConflict: "animal_type,group_key" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cession-templates"] });
      toast.success("Plantilla guardada correctamente");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}
