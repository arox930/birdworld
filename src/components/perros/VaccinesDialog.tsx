import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVaccines, useCreateVaccine } from "@/hooks/useDogs";
import type { Dog } from "@/hooks/useDogs";
import { format } from "date-fns";
import { Plus, Syringe } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog | null;
};

export function VaccinesDialog({ open, onOpenChange, dog }: Props) {
  const { data: vaccines, isLoading } = useVaccines(dog?.id ?? null);
  const createVaccine = useCreateVaccine();
  const [adding, setAdding] = useState(false);
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");

  if (!dog) return null;

  const handleAdd = () => {
    if (!fecha || !descripcion.trim()) return;
    createVaccine.mutate(
      { dog_id: dog.id, fecha, descripcion: descripcion.trim() },
      { onSuccess: () => { setAdding(false); setFecha(""); setDescripcion(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" /> Vacunación — {dog.nombre}
          </DialogTitle>
        </DialogHeader>

        {dog.ultima_vacunacion && (
          <p className="text-sm text-muted-foreground">Última vacunación: {format(new Date(dog.ultima_vacunacion), "dd-MM-yyyy")}</p>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : vaccines && vaccines.length > 0 ? (
            vaccines.map(v => (
              <div key={v.id} className="rounded-md border border-border p-3 text-sm space-y-1">
                <p className="font-medium">{format(new Date(v.fecha), "dd-MM-yyyy")}</p>
                <p className="text-muted-foreground">{v.descripcion}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin vacunas registradas</p>
          )}
        </div>

        {adding ? (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></div>
              <div><Label>Descripción</Label><Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Rabia" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd} disabled={createVaccine.isPending}>Guardar</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Añadir vacuna
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
