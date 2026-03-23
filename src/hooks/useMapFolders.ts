import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MapFolder {
  id: string;
  nombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  collapsed: boolean;
  created_at: string;
}

export function useMapFolders() {
  return useQuery({
    queryKey: ["map_folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_folders")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as MapFolder[];
    },
  });
}

export function useCreateMapFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folder: { nombre: string; x?: number; y?: number; color?: string }) => {
      const { data, error } = await supabase
        .from("map_folders")
        .insert(folder)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_folders"] }),
  });
}

export function useUpdateMapFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MapFolder> & { id: string }) => {
      const { error } = await supabase
        .from("map_folders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_folders"] }),
  });
}

export function useDeleteMapFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("map_folders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["map_folders"] });
      qc.invalidateQueries({ queryKey: ["map_zones"] });
    },
  });
}

export function useAssignZoneToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zoneId, folderId }: { zoneId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("map_zones")
        .update({ folder_id: folderId })
        .eq("id", zoneId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map_zones"] }),
  });
}
