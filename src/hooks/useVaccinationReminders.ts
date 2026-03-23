import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VaccinationReminder = {
  id: string;
  dog_id: string;
  fecha: string;
  descripcion: string;
  completado: boolean;
  completed_at: string | null;
  created_at: string;
  dogs?: { nombre: string; raza: string } | null;
};

export function useVaccinationReminders(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["vaccination-reminders", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vaccination_reminders")
        .select("*, dogs(nombre, raza)")
        .gte("fecha", startDate)
        .lt("fecha", endDate)
        .order("fecha", { ascending: true });
      if (error) throw error;
      return data as VaccinationReminder[];
    },
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: { dog_id: string; fecha: string; descripcion: string }) => {
      const { data, error } = await supabase
        .from("vaccination_reminders")
        .insert(reminder)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vaccination-reminders"] });
      toast.success("Recordatorio añadido");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useCompleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: { id: string; dog_id: string; fecha: string; descripcion: string }) => {
      // Mark reminder as completed
      const { error: updateError } = await supabase
        .from("vaccination_reminders")
        .update({ completado: true, completed_at: new Date().toISOString() })
        .eq("id", reminder.id);
      if (updateError) throw updateError;

      // Create vaccine record on the dog
      const { error: vaccineError } = await supabase
        .from("vaccines")
        .insert({ dog_id: reminder.dog_id, fecha: reminder.fecha, descripcion: reminder.descripcion });
      if (vaccineError) throw vaccineError;

      // Update ultima_vacunacion on dog
      await supabase.from("dogs").update({ ultima_vacunacion: reminder.fecha }).eq("id", reminder.dog_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vaccination-reminders"] });
      qc.invalidateQueries({ queryKey: ["vaccines"] });
      qc.invalidateQueries({ queryKey: ["dogs"] });
      toast.success("Vacuna registrada correctamente");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vaccination_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vaccination-reminders"] });
      toast.success("Recordatorio eliminado");
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
}
