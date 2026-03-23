import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLitters, useCreateLitter, useUpdateLitter, useDeleteLitter } from "@/hooks/useDogs";
import type { Dog, Litter } from "@/hooks/useDogs";
import { format } from "date-fns";
import { Plus, Baby, Pencil, Trash2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog: Dog | null;
};

function LitterPuppies({ litterId }: { litterId: string }) {
  const { data: puppies = [] } = useQuery({
    queryKey: ["litter-puppies", litterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("id, nombre, sexo, color, raza")
        .eq("litter_id", litterId)
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  if (puppies.length === 0) return null;

  return (
    <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Cachorros vinculados:</p>
      {puppies.map(p => (
        <p key={p.id} className="text-xs">
          {p.nombre} — {p.sexo} — {p.color}
        </p>
      ))}
    </div>
  );
}

type LitterFormData = {
  fecha: string;
  nacidos_total: string;
  muertos_parto: string;
  machos: string;
  hembras: string;
  notas: string;
};

const emptyForm: LitterFormData = { fecha: "", nacidos_total: "", muertos_parto: "0", machos: "", hembras: "", notas: "" };

function LitterForm({ initial, onSave, onCancel, isPending }: {
  initial: LitterFormData;
  onSave: (form: LitterFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<LitterFormData>(initial);

  const nacidos = parseInt(form.nacidos_total) || 0;
  const muertos = parseInt(form.muertos_parto) || 0;
  const machos = parseInt(form.machos) || 0;
  const hembras = parseInt(form.hembras) || 0;
  const isValid = form.fecha && nacidos > 0 && nacidos === muertos + machos + hembras;

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
        <div><Label>Nacidos total *</Label><Input type="number" min={0} value={form.nacidos_total} onChange={e => setForm(f => ({ ...f, nacidos_total: e.target.value }))} /></div>
        <div><Label>Muertos en parto</Label><Input type="number" min={0} value={form.muertos_parto} onChange={e => setForm(f => ({ ...f, muertos_parto: e.target.value }))} /></div>
        <div><Label>Machos</Label><Input type="number" min={0} value={form.machos} onChange={e => setForm(f => ({ ...f, machos: e.target.value }))} /></div>
        <div><Label>Hembras</Label><Input type="number" min={0} value={form.hembras} onChange={e => setForm(f => ({ ...f, hembras: e.target.value }))} /></div>
      </div>
      <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} /></div>
      {nacidos > 0 && !isValid && (
        <p className="text-xs text-destructive">
          Nacidos ({nacidos}) debe ser igual a muertos ({muertos}) + machos ({machos}) + hembras ({hembras}) = {muertos + machos + hembras}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={isPending || !isValid}>Guardar</Button>
      </div>
    </div>
  );
}

export function LittersDialog({ open, onOpenChange, dog }: Props) {
  const { data: litters, isLoading } = useLitters(dog?.id ?? null);
  const createLitter = useCreateLitter();
  const updateLitter = useUpdateLitter();
  const deleteLitter = useDeleteLitter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!dog) return null;

  const handleAdd = (form: LitterFormData) => {
    createLitter.mutate(
      {
        mother_dog_id: dog.id,
        fecha: form.fecha,
        nacidos_total: parseInt(form.nacidos_total),
        muertos_parto: parseInt(form.muertos_parto) || 0,
        machos: parseInt(form.machos) || 0,
        hembras: parseInt(form.hembras) || 0,
        notas: form.notas || undefined,
      },
      { onSuccess: () => setAdding(false) }
    );
  };

  const handleUpdate = (litter: Litter, form: LitterFormData) => {
    updateLitter.mutate(
      {
        id: litter.id,
        fecha: form.fecha,
        nacidos_total: parseInt(form.nacidos_total),
        muertos_parto: parseInt(form.muertos_parto) || 0,
        machos: parseInt(form.machos) || 0,
        hembras: parseInt(form.hembras) || 0,
        notas: form.notas || null,
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" /> Camadas — {dog.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : litters && litters.length > 0 ? (
            litters.map(l => (
              <div key={l.id}>
                {editingId === l.id ? (
                  <LitterForm
                    initial={{
                      fecha: l.fecha,
                      nacidos_total: String(l.nacidos_total),
                      muertos_parto: String(l.muertos_parto),
                      machos: String(l.machos),
                      hembras: String(l.hembras),
                      notas: l.notas || "",
                    }}
                    onSave={(form) => handleUpdate(l, form)}
                    onCancel={() => setEditingId(null)}
                    isPending={updateLitter.isPending}
                  />
                ) : (
                  <div className="rounded-md border border-border p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{format(new Date(l.fecha), "dd-MM-yyyy")}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(l.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteLitter.mutate(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-muted-foreground flex-wrap">
                      <span>Nacidos: {l.nacidos_total}</span>
                      <span>Muertos: {l.muertos_parto}</span>
                      <span>♂ {l.machos}</span>
                      <span>♀ {l.hembras}</span>
                    </div>
                    {l.notas && <p className="text-muted-foreground">{l.notas}</p>}
                    <LitterPuppies litterId={l.id} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin camadas registradas</p>
          )}
        </div>

        {adding ? (
          <LitterForm
            initial={emptyForm}
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            isPending={createLitter.isPending}
          />
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Añadir camada
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
