import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Attachment = {
  id: string;
  animal_id: string;
  animal_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
};

const MAX_ATTACHMENTS = 5;

export function useAttachments(animalId: string | null, animalType: "bird" | "dog") {
  return useQuery({
    queryKey: ["attachments", animalId],
    enabled: !!animalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animal_attachments")
        .select("*")
        .eq("animal_id", animalId!)
        .eq("animal_type", animalType)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Attachment[];
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      animalId,
      animalType,
      file,
    }: {
      animalId: string;
      animalType: "bird" | "dog";
      file: File;
    }) => {
      // Check current count
      const { count, error: countError } = await supabase
        .from("animal_attachments")
        .select("*", { count: "exact", head: true })
        .eq("animal_id", animalId)
        .eq("animal_type", animalType);
      if (countError) throw countError;
      if ((count ?? 0) >= MAX_ATTACHMENTS) {
        throw new Error(`Máximo ${MAX_ATTACHMENTS} archivos por ejemplar`);
      }

      const ext = file.name.split(".").pop();
      const filePath = `${animalType}/${animalId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("animal_attachments")
        .insert({
          animal_id: animalId,
          animal_type: animalType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        });
      if (dbError) throw dbError;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["attachments", vars.animalId] });
      toast.success("Archivo adjuntado");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: Attachment) => {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("animal_attachments")
        .delete()
        .eq("id", attachment.id);
      if (dbError) throw dbError;
    },
    onSuccess: (_, attachment) => {
      qc.invalidateQueries({ queryKey: ["attachments", attachment.animal_id] });
      toast.success("Archivo eliminado");
    },
    onError: (e) => toast.error(`Error al eliminar: ${e.message}`),
  });
}

export function useDownloadAttachment() {
  return async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from("attachments")
      .download(attachment.file_path);
    if (error) {
      toast.error("Error al descargar");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };
}
