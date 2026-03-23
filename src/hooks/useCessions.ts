import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useCallback, useState } from "react";

export type Buyer = Tables<"buyers">;
export type Cession = Tables<"cessions">;

export function useBuyers() {
  return useQuery({
    queryKey: ["buyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .order("apellidos");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBuyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (buyer: { nombre: string; apellidos: string; dni: string; domicilio: string }) => {
      const { data, error } = await supabase.from("buyers").insert(buyer).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyers"] });
      toast.success("Comprador creado");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function usePreviewCession() {
  return useMutation({
    mutationFn: async (params: {
      animal_id: string;
      animal_type: "bird" | "dog";
      buyer_id: string;
      precio: number;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-cession-pdf", {
        body: { ...params, preview_only: true },
      });
      if (error) {
        try {
          const context = (error as any).context;
          if (context instanceof Response) {
            const body = await context.json();
            if (body?.error) throw new Error(body.error);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data as { rendered_html: string };
    },
    onError: (e) => toast.error(`Error al cargar previsualización: ${e.message}`),
  });
}

export function useGenerateCession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      animal_id: string;
      animal_type: "bird" | "dog";
      buyer_id: string;
      precio: number;
      rendered_html?: string;
      vendedor_nombre?: string;
      vendedor_dni?: string;
      vendedor_domicilio?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-cession-pdf", {
        body: params,
      });
      if (error) {
        try {
          const context = (error as any).context;
          if (context instanceof Response) {
            const body = await context.json();
            if (body?.error) throw new Error(body.error);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; pdf_url: string; pdf_ref: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["birds"] });
      qc.invalidateQueries({ queryKey: ["dogs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["cession"] });
      toast.success("Documento de cesión generado correctamente");
    },
    onError: (e) => toast.error(`Error al generar cesión: ${e.message}`),
  });
}

export function useCessionByAnimal(animalId: string | null, animalType: "bird" | "dog") {
  return useQuery({
    queryKey: ["cession", animalId, animalType],
    enabled: !!animalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cessions")
        .select("*, buyers(*)")
        .eq("animal_id", animalId!)
        .eq("animal_type", animalType)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useDownloadCessionPdf() {
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async (animalId: string, animalType: "bird" | "dog") => {
    setDownloading(true);
    try {
      const { data: cessions, error } = await supabase
        .from("cessions")
        .select("pdf_ref, buyers(nombre, apellidos)")
        .eq("animal_id", animalId)
        .eq("animal_type", animalType)
        .order("created_at", { ascending: false })
        .limit(1);

      const cession = cessions?.[0] as any;
      if (error || !cession?.pdf_ref) {
        toast.error("No se encontró el documento de cesión");
        return;
      }

      const buyerName = cession.buyers
        ? `${cession.buyers.nombre}_${cession.buyers.apellidos}`.replace(/\s+/g, '_')
        : "comprador";

      const { data: urlData } = await supabase.storage
        .from("cessions")
        .createSignedUrl(cession.pdf_ref, 3600);

      if (!urlData?.signedUrl) {
        toast.error("Error al obtener URL del documento");
        return;
      }

      const res = await fetch(urlData.signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cesion_${buyerName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar el documento");
    } finally {
      setDownloading(false);
    }
  }, []);

  return { download, downloading };
}
