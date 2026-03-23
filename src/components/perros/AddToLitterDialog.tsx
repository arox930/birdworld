import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Dog } from "@/hooks/useDogs";
import { format } from "date-fns";
import { CheckCircle, ArrowRightLeft } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog | null;
};

export function AddToLitterDialog({ open, onOpenChange, dog }: Props) {
  const queryClient = useQueryClient();
  const [selectedMotherId, setSelectedMotherId] = useState<string>("");
  const [selectedLitterId, setSelectedLitterId] = useState<string>("");
  const [wantsChange, setWantsChange] = useState(false);

  const alreadyAssigned = !!dog?.litter_id;

  // Fetch current litter info if already assigned
  const { data: currentLitter } = useQuery({
    queryKey: ["litter-info", dog?.litter_id],
    enabled: open && !!dog?.litter_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("litters")
        .select("*, mother:mother_dog_id(nombre, raza)")
        .eq("id", dog!.litter_id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch mothers (female dogs with litters)
  const { data: mothers = [] } = useQuery({
    queryKey: ["mothers-with-litters"],
    enabled: open && (!alreadyAssigned || wantsChange),
    queryFn: async () => {
      const { data: litters } = await supabase.from("litters").select("mother_dog_id");
      if (!litters?.length) return [];
      const motherIds = [...new Set(litters.map(l => l.mother_dog_id))];
      const { data: dogs } = await supabase.from("dogs").select("id, nombre, raza").in("id", motherIds);
      return dogs ?? [];
    },
  });

  // Fetch litters for selected mother
  const { data: litters = [] } = useQuery({
    queryKey: ["litters", selectedMotherId],
    enabled: !!selectedMotherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("litters")
        .select("*")
        .eq("mother_dog_id", selectedMotherId)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!dog || !selectedLitterId) return;
      const { error } = await supabase
        .from("dogs")
        .update({ litter_id: selectedLitterId, madre_id: selectedMotherId })
        .eq("id", dog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cachorro asignado a la camada");
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      queryClient.invalidateQueries({ queryKey: ["litter-puppies"] });
      handleClose();
    },
    onError: (e: Error) => toast.error("Error: " + e.message),
  });

  const handleClose = () => {
    setSelectedMotherId("");
    setSelectedLitterId("");
    setWantsChange(false);
    onOpenChange(false);
  };

  if (!dog) return null;

  const showAssignmentInfo = alreadyAssigned && !wantsChange;
  const showForm = !alreadyAssigned || wantsChange;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir a camada — {dog.nombre}</DialogTitle>
        </DialogHeader>

        {showAssignmentInfo && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Ya está asignado a una camada</p>
                {currentLitter && (
                  <p className="text-muted-foreground mt-1">
                    Madre: {(currentLitter.mother as any)?.nombre ?? "—"} ({(currentLitter.mother as any)?.raza ?? "—"})
                    <br />
                    Fecha: {format(new Date(currentLitter.fecha), "dd-MM-yyyy")} — {currentLitter.nacidos_total} nacidos
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Aceptar</Button>
              <Button variant="secondary" onClick={() => setWantsChange(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Modificar
              </Button>
            </DialogFooter>
          </div>
        )}

        {showForm && (
          <>
            <div className="space-y-4 py-4">
              {wantsChange && (
                <p className="text-sm text-muted-foreground">Selecciona la nueva camada a la que quieres asignar este cachorro.</p>
              )}
              <div className="space-y-2">
                <Label>Madre</Label>
                <Select value={selectedMotherId} onValueChange={(v) => { setSelectedMotherId(v); setSelectedLitterId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecciona madre" /></SelectTrigger>
                  <SelectContent>
                    {mothers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.raza})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedMotherId && (
                <div className="space-y-2">
                  <Label>Camada</Label>
                  <Select value={selectedLitterId} onValueChange={setSelectedLitterId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona camada" /></SelectTrigger>
                    <SelectContent>
                      {litters.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {format(new Date(l.fecha), "dd-MM-yyyy")} — {l.nacidos_total} nacidos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={() => assignMutation.mutate()} disabled={!selectedLitterId || assignMutation.isPending}>
                {assignMutation.isPending ? "Guardando..." : "Asignar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
