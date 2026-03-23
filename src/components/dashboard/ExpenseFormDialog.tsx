import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Constants } from "@/integrations/supabase/types";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const BIRD_SPECIES = Constants.public.Enums.bird_species;

export type Expense = {
  id: string;
  monto: number;
  fecha: string;
  animal_type: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
};

export function ExpenseFormDialog({ open, onOpenChange, expense }: Props) {
  const queryClient = useQueryClient();
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [animalType, setAnimalType] = useState<"bird" | "dog" | "">("");
  const [categoria, setCategoria] = useState<string>("");
  const [subcategoria, setSubcategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");

  const [dogBreeds, setDogBreeds] = useState<string[]>([]);
  const [birdSubspecies, setBirdSubspecies] = useState<{ id: string; nombre_especie: string }[]>([]);

  const isEditing = !!expense;

  // Populate form when editing
  useEffect(() => {
    if (expense && open) {
      setMonto(String(expense.monto));
      setFecha(expense.fecha);
      setAnimalType(expense.animal_type as "bird" | "dog");
      setCategoria(expense.categoria);
      setSubcategoria(expense.subcategoria || "");
      setDescripcion(expense.descripcion || "");
    } else if (!expense && open) {
      resetForm();
    }
  }, [expense, open]);

  // Load dog breeds
  useEffect(() => {
    supabase.from("dogs").select("raza").then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(d => d.raza))].sort();
        setDogBreeds(unique);
      }
    });
  }, []);

  // Load bird subspecies when category changes
  useEffect(() => {
    if (animalType === "bird" && categoria) {
      supabase
        .from("bird_species_catalog")
        .select("id, nombre_especie")
        .eq("nombre_comun", categoria)
        .then(({ data }) => {
          setBirdSubspecies(data ?? []);
        });
    } else {
      setBirdSubspecies([]);
    }
  }, [animalType, categoria]);

  const resetForm = () => {
    setMonto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setAnimalType("");
    setCategoria("");
    setSubcategoria("");
    setDescripcion("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        monto: parseFloat(monto),
        fecha,
        animal_type: animalType,
        categoria,
        subcategoria: animalType === "bird" ? subcategoria || null : null,
        descripcion: descripcion || null,
      };
      if (isEditing) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", expense!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Gasto actualizado" : "Gasto registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error("Error al guardar: " + err.message);
    },
  });

  const isValid = monto && parseFloat(monto) > 0 && fecha && animalType && categoria;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto (€)</Label>
            <Input id="monto" type="number" step="0.01" min="0" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de animal</Label>
            <Select value={animalType} onValueChange={(v) => { setAnimalType(v as "bird" | "dog"); setCategoria(""); setSubcategoria(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bird">Aves</SelectItem>
                <SelectItem value="dog">Perros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {animalType === "dog" && (
            <div className="space-y-2">
              <Label>Raza</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecciona raza" /></SelectTrigger>
                <SelectContent>
                  {dogBreeds.map((breed) => (<SelectItem key={breed} value={breed}>{breed}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {animalType === "bird" && (
            <div className="space-y-2">
              <Label>Nombre común</Label>
              <Select value={categoria} onValueChange={(v) => { setCategoria(v); setSubcategoria(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecciona nombre común" /></SelectTrigger>
                <SelectContent>
                  {BIRD_SPECIES.map((species) => (<SelectItem key={species} value={species}>{getSpeciesDisplayName(species)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {animalType === "bird" && categoria && birdSubspecies.length > 0 && (
            <div className="space-y-2">
              <Label>Especie (opcional)</Label>
              <Select value={subcategoria || "__none__"} onValueChange={(v) => setSubcategoria(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas las especies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas las especies</SelectItem>
                  {birdSubspecies.map((sp) => (<SelectItem key={sp.id} value={sp.nombre_especie}>{sp.nombre_especie}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input id="descripcion" placeholder="Ej: Comida, veterinario..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
